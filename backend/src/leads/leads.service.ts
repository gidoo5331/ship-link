import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { LeadStatus, LeadType, ProductStatus } from 'generated/prisma/enums';
import { CustomersService } from 'src/customers/customers.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { phoneKey } from 'src/shared';
import { StorageService } from 'src/storage/storage.service';
import {
  ConvertLeadDto,
  CreatePublicLeadDto,
  UpdateLeadDto,
} from './dto/lead.dto';

export interface LeadListQuery {
  status?: string;
  type?: string;
  search?: string;
  page?: string;
  pageSize?: string;
}

const leadInclude = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      images: true,
      price: true,
      currency: true,
      status: true,
      rental: { select: { rate: true, currency: true, unit: true } },
    },
  },
  agent: {
    select: {
      id: true,
      referralCode: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
  customer: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.LeadInclude;

type LeadWithRelations = Prisma.LeadGetPayload<{ include: typeof leadInclude }>;

// the same person asking about the same thing again within this window is
// treated as one enquiry
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customers: CustomersService,
    private readonly storage: StorageService,
  ) {}

  // ── Public: website "I'm interested" / custom request ─────────────────────

  async createPublicLead(subdomain: string, dto: CreatePublicLeadDto) {
    // spam trap filled in: pretend it worked, store nothing
    if (dto.website?.trim()) {
      this.logger.warn(`Spam trap triggered for ${subdomain}`);
      return { received: true };
    }

    const company = await this.prisma.company.findFirst({
      where: { subdomain, status: 'APPROVED' },
      select: { id: true, rentalsEnabled: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const type = dto.type ?? LeadType.PURCHASE;
    const rental = type === LeadType.RENTAL;
    if (rental && (!company.rentalsEnabled || !dto.productId)) {
      throw new BadRequestException('Choose something to rent');
    }

    let product: { id: string; name: string } | null = null;
    if (dto.productId) {
      product = await this.prisma.product.findFirst({
        where: {
          id: dto.productId,
          companyId: company.id,
          status: ProductStatus.PUBLISHED,
          ...(rental && { rental: { isNot: null } }),
        },
        select: { id: true, name: true },
      });
      if (!product)
        throw new BadRequestException(
          rental
            ? 'That item is no longer available to rent'
            : 'That product is no longer available',
        );
    }

    const key = phoneKey(dto.phone);
    const customRequest = dto.customRequest?.trim() || null;

    const duplicate = await this.prisma.lead.findFirst({
      where: {
        companyId: company.id,
        phoneKey: key,
        type,
        status: LeadStatus.NEW,
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
        ...(product
          ? { productId: product.id }
          : { productId: null, customRequest }),
      },
      select: { id: true },
    });
    if (duplicate) return { received: true };

    const referralCode = dto.referralCode?.trim() || null;
    const agent = referralCode
      ? await this.prisma.agent.findFirst({
          where: {
            companyId: company.id,
            referralCode: { equals: referralCode, mode: 'insensitive' },
          },
          select: { id: true },
        })
      : null;

    await this.prisma.lead.create({
      data: {
        companyId: company.id,
        type,
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        phoneKey: key,
        location: dto.location?.trim() || null,
        productId: product?.id ?? null,
        productName: product?.name ?? null,
        customRequest,
        referralCode,
        agentId: agent?.id ?? null,
      },
    });

    // nothing about the company's data is echoed back to the public
    return { received: true };
  }

  // ── Portal: inbox ─────────────────────────────────────────────────────────

  async getLeads(companyId: string, query: LeadListQuery) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(query.pageSize ?? '25', 10) || 25),
    );
    const status = Object.values(LeadStatus).includes(
      query.status as LeadStatus,
    )
      ? (query.status as LeadStatus)
      : undefined;
    const type = Object.values(LeadType).includes(query.type as LeadType)
      ? (query.type as LeadType)
      : undefined;
    const search = query.search?.trim();
    const digits = search?.replace(/\D/g, '');

    const where: Prisma.LeadWhereInput = {
      companyId,
      ...(status && { status }),
      ...(type && { type }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { productName: { contains: search, mode: 'insensitive' } },
          { customRequest: { contains: search, mode: 'insensitive' } },
          ...(digits && digits.length >= 3
            ? [{ phoneKey: { contains: digits.replace(/^0/, '') } }]
            : []),
        ],
      }),
    };

    const [items, total, grouped] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        include: leadInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.lead.count({ where }),
      this.prisma.lead.groupBy({
        by: ['status'],
        // the tab counts follow the buying/renting filter
        where: { companyId, ...(type && { type }) },
        _count: { _all: true },
        orderBy: { status: 'asc' },
      }),
    ]);

    // lowercase keys: the snake_case interceptor would turn "NEW" into "n_e_w"
    const counts = Object.fromEntries(
      Object.values(LeadStatus).map((s) => [s.toLowerCase(), 0]),
    ) as Record<Lowercase<LeadStatus>, number>;
    for (const g of grouped)
      counts[g.status.toLowerCase() as Lowercase<LeadStatus>] = (
        g._count as { _all: number }
      )._all;

    return {
      items: items.map((l) => this.toResponse(l)),
      total,
      page,
      pageSize,
      counts,
    };
  }

  async getLead(companyId: string, id: string) {
    const lead = await this.findOrThrow(companyId, id);
    // existing customers with the same phone, to avoid duplicates on convert
    const matchingCustomers = lead.customerId
      ? []
      : await this.customers.findByPhone(companyId, lead.phone);
    return { ...this.toResponse(lead), matchingCustomers };
  }

  // ── Portal: status and notes ──────────────────────────────────────────────

  async updateLead(companyId: string, id: string, dto: UpdateLeadDto) {
    const lead = await this.findOrThrow(companyId, id);

    if (dto.status && lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException(
        'This lead is already a customer; its status can’t change',
      );
    }

    const now = new Date();
    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(dto.notes !== undefined && { notes: dto.notes.trim() || null }),
        ...(dto.status && { status: dto.status }),
        ...(dto.status === 'CONTACTED' &&
          !lead.contactedAt && { contactedAt: now }),
        ...(dto.status === 'CLOSED' && { closedAt: now }),
        ...(dto.status && dto.status !== 'CLOSED' && { closedAt: null }),
      },
      include: leadInclude,
    });
    return this.toResponse(updated);
  }

  // ── Portal: convert to a customer (new or existing) ───────────────────────

  async convertLead(companyId: string, id: string, dto: ConvertLeadDto) {
    const lead = await this.findOrThrow(companyId, id);
    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('This lead is already a customer');
    }

    const converted = await this.prisma.$transaction(async (tx) => {
      let customerId: string;
      if (dto.customerId) {
        const existing = await tx.customer.findFirst({
          where: { id: dto.customerId, companyId },
          select: { id: true },
        });
        if (!existing) throw new BadRequestException('Customer not found');
        customerId = existing.id;
      } else {
        customerId = (
          await this.customers.createCustomer(companyId, dto.customer!, tx)
        ).id;
      }

      return tx.lead.update({
        where: { id },
        data: {
          status: LeadStatus.CONVERTED,
          customerId,
          convertedAt: new Date(),
          closedAt: null,
          contactedAt: lead.contactedAt ?? new Date(),
        },
        include: leadInclude,
      });
    });

    return this.toResponse(converted);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async findOrThrow(companyId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, companyId },
      include: leadInclude,
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  private toResponse(lead: LeadWithRelations) {
    const { product, agent, ...rest } = lead;
    return {
      ...rest,
      product: product && {
        id: product.id,
        name: product.name,
        slug: product.slug,
        status: product.status,
        price: product.price === null ? null : product.price.toNumber(),
        currency: product.currency,
        rental: product.rental && {
          rate: product.rental.rate.toNumber(),
          currency: product.rental.currency,
          unit: product.rental.unit,
        },
        imageUrl: product.images[0]
          ? this.storage.getPublicUrl(product.images[0])
          : null,
      },
      agent: agent && {
        id: agent.id,
        referralCode: agent.referralCode,
        name: `${agent.user.firstName} ${agent.user.lastName}`,
      },
    };
  }
}
