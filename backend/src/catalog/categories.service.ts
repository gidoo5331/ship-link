import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { slugify } from 'src/shared';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

// Offered to new companies; they can edit or delete any of these.
const STARTER_CATEGORIES: { name: string; specTemplate: string[] }[] = [
  {
    name: 'Cars',
    specTemplate: [
      'Make',
      'Model',
      'Year',
      'Mileage',
      'Engine',
      'Transmission',
      'Condition',
    ],
  },
  {
    name: 'Generators',
    specTemplate: ['Power output', 'Fuel type', 'Runtime', 'Phase'],
  },
  { name: 'Electronics', specTemplate: ['Brand', 'Model', 'Warranty'] },
  { name: 'Household', specTemplate: [] },
];

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Find all ──────────────────────────────────────────────────────────────

  async getCategories(companyId: string) {
    const categories = await this.prisma.category.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        specTemplate: true,
        _count: { select: { products: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    // `_count` doesn't survive key-case conversion cleanly; flatten it
    return categories.map(({ _count, ...category }) => ({
      ...category,
      productCount: _count.products,
    }));
  }

  // ── Find one ──────────────────────────────────────────────────────────────

  async getCategory(companyId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, companyId },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async createCategory(companyId: string, dto: CreateCategoryDto) {
    const slug = await this.uniqueSlug(companyId, dto.name);

    // new categories go last unless an order is given
    const last = await this.prisma.category.aggregate({
      where: { companyId },
      _max: { sortOrder: true },
    });

    return this.prisma.category.create({
      data: {
        companyId,
        name: dto.name.trim(),
        slug,
        specTemplate: dto.specTemplate ?? [],
        sortOrder: dto.sortOrder ?? (last._max.sortOrder ?? -1) + 1,
      },
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async updateCategory(companyId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.getCategory(companyId, id);

    const nameChanged =
      dto.name !== undefined && dto.name.trim() !== category.name;

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(nameChanged && {
          name: dto.name!.trim(),
          slug: await this.uniqueSlug(companyId, dto.name!, id),
        }),
        ...(dto.specTemplate !== undefined && {
          specTemplate: dto.specTemplate,
        }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  // ── Delete — products are kept and become uncategorised ───────────────────

  async deleteCategory(companyId: string, id: string) {
    await this.getCategory(companyId, id);
    const uncategorised = await this.prisma.product.count({
      where: { companyId, categoryId: id },
    });
    await this.prisma.category.delete({ where: { id } });
    return {
      message: 'Category deleted',
      uncategorisedProducts: uncategorised,
    };
  }

  // ── Starter set — only when the company has no categories yet ─────────────

  async createStarterCategories(companyId: string) {
    const existing = await this.prisma.category.count({ where: { companyId } });
    if (existing > 0) {
      throw new ConflictException(
        'Starter categories can only be added before any category exists',
      );
    }

    await this.prisma.category.createMany({
      data: STARTER_CATEGORIES.map((c, index) => ({
        companyId,
        name: c.name,
        slug: slugify(c.name),
        specTemplate: c.specTemplate,
        sortOrder: index,
      })),
    });

    return this.getCategories(companyId);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async uniqueSlug(
    companyId: string,
    name: string,
    excludeId?: string,
  ) {
    const base = slugify(name) || 'category';
    let slug = base;

    for (let n = 2; ; n++) {
      const clash = await this.prisma.category.findFirst({
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
}
