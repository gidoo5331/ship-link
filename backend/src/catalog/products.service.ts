import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from 'generated/prisma/client';
import {
  ProductAvailability,
  ProductStatus,
  RentalUnit,
} from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { slugify } from 'src/shared';
import {
  CreateImageUploadDto,
  CreateProductDto,
  MAX_IMAGES_PER_PRODUCT,
  ProductRentalDto,
  UpdateProductDto,
} from './dto';

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  rental: true,
} satisfies Prisma.ProductInclude;

type ProductWithCategory = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

export interface ProductListQuery {
  status?: string;
  availability?: string;
  categoryId?: string; // 'none' = uncategorised
  listing?: string; // 'sale' | 'rent'
  search?: string;
  page?: string;
  pageSize?: string;
}

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // ── Find all (portal) ─────────────────────────────────────────────────────

  async getProducts(companyId: string, query: ProductListQuery) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(query.pageSize ?? '24', 10) || 24),
    );

    const where: Prisma.ProductWhereInput = {
      companyId,
      // archived products are hidden unless asked for explicitly
      status: this.parseEnum(ProductStatus, query.status) ?? {
        not: ProductStatus.ARCHIVED,
      },
      ...(this.parseEnum(ProductAvailability, query.availability) && {
        availability: this.parseEnum(ProductAvailability, query.availability),
      }),
      ...(query.categoryId && {
        categoryId: query.categoryId === 'none' ? null : query.categoryId,
      }),
      ...this.listingWhere(query.listing),
      ...(query.search && {
        name: { contains: query.search.trim(), mode: 'insensitive' },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((p) => this.toResponse(p)),
      total,
      page,
      pageSize,
    };
  }

  // ── Find one (portal) ─────────────────────────────────────────────────────

  async getProduct(companyId: string, id: string) {
    return this.toResponse(await this.findOrThrow(companyId, id));
  }

  // ── Create — always a draft ───────────────────────────────────────────────

  async createProduct(
    companyId: string,
    dto: CreateProductDto,
    userId: string,
  ) {
    if (dto.categoryId) await this.assertCategory(companyId, dto.categoryId);

    const product = await this.prisma.product.create({
      data: {
        companyId,
        createdById: userId,
        name: dto.name.trim(),
        slug: await this.uniqueSlug(companyId, dto.name),
        categoryId: dto.categoryId ?? null,
        description: dto.description,
        price: dto.price ?? null,
        currency: dto.currency ?? 'USD',
        availability: dto.availability ?? ProductAvailability.AVAILABLE,
        leadTime: dto.leadTime ?? null,
        forSale: dto.forSale ?? true,
        ...(dto.rental && { rental: { create: this.rentalData(dto.rental) } }),
        specs: (dto.specs ?? []) as unknown as Prisma.InputJsonValue,
        features: dto.features ?? [],
      },
      include: productInclude,
    });

    return this.toResponse(product);
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async updateProduct(companyId: string, id: string, dto: UpdateProductDto) {
    const product = await this.findOrThrow(companyId, id);

    if (dto.categoryId) await this.assertCategory(companyId, dto.categoryId);

    let removedImages: string[] = [];
    if (dto.images !== undefined) {
      const prefix = this.imagePrefix(companyId, id);
      // new images must be this product's uploads; ones it already has
      // (including seeded external URLs) can be kept or reordered
      const invalid = dto.images.find(
        (key) => !key.startsWith(prefix) && !product.images.includes(key),
      );
      if (invalid)
        throw new BadRequestException(
          `Image ${invalid} does not belong to this product`,
        );
      if (new Set(dto.images).size !== dto.images.length) {
        throw new BadRequestException('Duplicate images');
      }
      removedImages = product.images.filter(
        (key) => !dto.images!.includes(key),
      );
    }

    // a published product keeps its URL; drafts follow their name
    const renamed = dto.name !== undefined && dto.name.trim() !== product.name;
    const reslug = renamed && product.status === ProductStatus.DRAFT;

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(renamed && { name: dto.name!.trim() }),
        ...(reslug && {
          slug: await this.uniqueSlug(companyId, dto.name!, id),
        }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.availability !== undefined && {
          availability: dto.availability,
        }),
        ...(dto.leadTime !== undefined && { leadTime: dto.leadTime }),
        ...(dto.forSale !== undefined && { forSale: dto.forSale }),
        ...(dto.rental && {
          rental: {
            upsert: {
              create: this.rentalData(dto.rental),
              update: this.rentalData(dto.rental),
            },
          },
        }),
        ...(dto.rental === null &&
          product.rental && { rental: { delete: true } }),
        ...(dto.specs !== undefined && {
          specs: dto.specs as unknown as Prisma.InputJsonValue,
        }),
        ...(dto.features !== undefined && { features: dto.features }),
        ...(dto.images !== undefined && { images: dto.images }),
      },
      include: productInclude,
    });

    // a published product must keep meeting the checklist
    if (updated.status === ProductStatus.PUBLISHED) {
      const missing = this.publishChecklist(updated);
      if (missing.length > 0) {
        await this.prisma.product.update({
          where: { id },
          data: { status: ProductStatus.DRAFT },
        });
        updated.status = ProductStatus.DRAFT;
      }
    }

    await this.storage.deleteMany(removedImages);
    return this.toResponse(updated);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async deleteProduct(companyId: string, id: string) {
    const product = await this.findOrThrow(companyId, id);
    await this.prisma.product.delete({ where: { id } });
    await this.storage.deleteMany(product.images);
    return { message: 'Product deleted' };
  }

  // ── Publish / unpublish / archive ─────────────────────────────────────────

  async publishProduct(companyId: string, id: string) {
    const product = await this.findOrThrow(companyId, id);

    const missing = this.publishChecklist(product);
    if (missing.length > 0) {
      throw new UnprocessableEntityException({
        message: 'Product is not ready to publish',
        missing,
      });
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.PUBLISHED,
        publishedAt: product.publishedAt ?? new Date(),
      },
      include: productInclude,
    });
    return this.toResponse(updated);
  }

  async unpublishProduct(companyId: string, id: string) {
    await this.findOrThrow(companyId, id);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.DRAFT },
      include: productInclude,
    });
    return this.toResponse(updated);
  }

  async archiveProduct(companyId: string, id: string) {
    await this.findOrThrow(companyId, id);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED },
      include: productInclude,
    });
    return this.toResponse(updated);
  }

  // ── Image upload URL ──────────────────────────────────────────────────────

  async createImageUpload(
    companyId: string,
    id: string,
    dto: CreateImageUploadDto,
  ) {
    const product = await this.findOrThrow(companyId, id);

    if (product.images.length >= MAX_IMAGES_PER_PRODUCT) {
      throw new BadRequestException(
        `A product can have at most ${MAX_IMAGES_PER_PRODUCT} images`,
      );
    }

    // the client uploads, then PATCHes the product with the new key in `images`
    const key = `${this.imagePrefix(companyId, id)}${randomUUID()}.${IMAGE_EXTENSIONS[dto.contentType]}`;
    return this.storage.createUploadUrl(key, dto.contentType, dto.size);
  }

  // ── Public (company website) ──────────────────────────────────────────────

  async getPublicCompany(subdomain: string) {
    const company = await this.prisma.company.findFirst({
      where: { subdomain, status: 'APPROVED' },
      select: {
        id: true,
        name: true,
        subdomain: true,
        email: true,
        phone: true,
        address: true,
        logoUrl: true,
        whatsapp: true,
        tagline: true,
        heroHeading: true,
        heroSubheading: true,
        about: true,
        rentalsEnabled: true,
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async getPublicCategories(subdomain: string) {
    const company = await this.getPublicCompany(subdomain);
    return this.prisma.category.findMany({
      where: {
        companyId: company.id,
        products: { some: this.publicListingWhere(company.rentalsEnabled) },
      },
      select: { id: true, name: true, slug: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getPublicProducts(
    subdomain: string,
    categorySlug?: string,
    listing?: string,
  ) {
    const company = await this.getPublicCompany(subdomain);
    const products = await this.prisma.product.findMany({
      where: {
        companyId: company.id,
        ...this.publicListingWhere(company.rentalsEnabled, listing),
        ...(categorySlug && { category: { slug: categorySlug } }),
      },
      include: productInclude,
      orderBy: { publishedAt: 'desc' },
    });
    return products.map((p) => this.toPublicResponse(p, company));
  }

  // sold products leave listings, but their page still resolves (shows "sold")
  async getPublicProduct(subdomain: string, slug: string) {
    const company = await this.getPublicCompany(subdomain);
    const product = await this.prisma.product.findFirst({
      where: {
        companyId: company.id,
        slug,
        status: ProductStatus.PUBLISHED,
        // rent-only products disappear when the company stops renting
        ...(!company.rentalsEnabled && { forSale: true }),
      },
      include: productInclude,
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.toPublicResponse(product, company);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  // rentals only show while the company has them turned on
  private publicListingWhere(
    rentalsEnabled: boolean,
    listing?: string,
  ): Prisma.ProductWhereInput {
    return {
      status: ProductStatus.PUBLISHED,
      availability: { not: ProductAvailability.SOLD },
      ...(rentalsEnabled
        ? this.listingWhere(listing)
        : listing === 'rent'
          ? { id: { in: [] } }
          : { forSale: true }),
    };
  }

  private listingWhere(listing?: string): Prisma.ProductWhereInput {
    if (listing === 'sale') return { forSale: true };
    if (listing === 'rent') return { rental: { isNot: null } };
    return {};
  }

  private rentalData(dto: ProductRentalDto) {
    return {
      rate: dto.rate,
      currency: dto.currency ?? 'GHS',
      unit: dto.unit ?? RentalUnit.DAY,
      notes: dto.notes?.trim() || null,
    };
  }

  // what a product still needs before it can go on the website
  private publishChecklist(product: ProductWithCategory): string[] {
    const missing: string[] = [];
    if (product.images.length === 0) missing.push('photo');
    if (!product.categoryId) missing.push('category');
    // a rent-only product needs a rental rate (always set) instead of a price
    if (!product.forSale && !product.rental) missing.push('offer');
    if (product.forSale && product.price === null) missing.push('price');
    if (!product.description?.trim()) missing.push('description');
    return missing;
  }

  private async findOrThrow(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId },
      include: productInclude,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async assertCategory(companyId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, companyId },
      select: { id: true },
    });
    if (!category) throw new BadRequestException('Category not found');
  }

  private async uniqueSlug(
    companyId: string,
    name: string,
    excludeId?: string,
  ) {
    const base = slugify(name) || 'product';
    let slug = base;

    for (let n = 2; ; n++) {
      const clash = await this.prisma.product.findFirst({
        where: {
          companyId,
          slug,
          ...(excludeId && { NOT: { id: excludeId } }),
        },
        select: { id: true },
      });
      if (!clash) return slug;
      slug = `${base}-${n}`;
    }
  }

  private imagePrefix(companyId: string, productId: string) {
    return `companies/${companyId}/products/${productId}/`;
  }

  private parseEnum<T extends Record<string, string>>(
    enumObj: T,
    value?: string,
  ) {
    return value && Object.values(enumObj).includes(value)
      ? (value as T[keyof T])
      : undefined;
  }

  // Decimal → number and image keys → URLs (the snake_case interceptor
  // would otherwise mangle Prisma's Decimal object)
  private toResponse(product: ProductWithCategory) {
    return {
      ...product,
      price: product.price === null ? null : product.price.toNumber(),
      rental: this.rentalResponse(product.rental),
      images: product.images.map((key) => ({
        key,
        url: this.storage.getPublicUrl(key),
      })),
      publishChecklist: this.publishChecklist(product),
    };
  }

  private rentalResponse(rental: ProductWithCategory['rental']) {
    return (
      rental && {
        rate: rental.rate.toNumber(),
        currency: rental.currency,
        unit: rental.unit,
        notes: rental.notes,
      }
    );
  }

  private toPublicResponse(
    product: ProductWithCategory,
    company: { rentalsEnabled: boolean },
  ) {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price === null ? null : product.price.toNumber(),
      currency: product.currency,
      availability: product.availability,
      leadTime: product.leadTime,
      forSale: product.forSale,
      rental: company.rentalsEnabled
        ? this.rentalResponse(product.rental)
        : null,
      images: product.images.map((key) => this.storage.getPublicUrl(key)),
      specs: product.specs,
      features: product.features,
      category: product.category,
      publishedAt: product.publishedAt,
    };
  }
}
