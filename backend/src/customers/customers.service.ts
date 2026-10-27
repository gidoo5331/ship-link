import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { phoneKey } from 'src/shared';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

type Db = PrismaService | Prisma.TransactionClient;

export interface CustomerListQuery {
  search?: string;
  page?: string;
  pageSize?: string;
}

const customerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  ghanaCardNumber: true,
  address: true,
  city: true,
  region: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── List ──────────────────────────────────────────────────────────────────

  async getCustomers(companyId: string, query: CustomerListQuery) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(query.pageSize ?? '25', 10) || 25),
    );
    const search = query.search?.trim();
    const digits = search?.replace(/\D/g, '');

    const where: Prisma.CustomerWhereInput = {
      companyId,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          ...(digits && digits.length >= 3
            ? [{ phoneKey: { contains: digits.replace(/^0/, '') } }]
            : []),
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        select: { ...customerSelect, _count: { select: { leads: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      // `_count` doesn't survive key-case conversion cleanly; flatten it
      items: items.map(({ _count, ...c }) => ({
        ...c,
        leadCount: _count.leads,
      })),
      total,
      page,
      pageSize,
    };
  }

  // ── One, with their enquiries ─────────────────────────────────────────────

  async getCustomer(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
      select: {
        ...customerSelect,
        leads: {
          select: {
            id: true,
            status: true,
            productName: true,
            customRequest: true,
            createdAt: true,
            product: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  // ── Create (also used when converting a lead) ─────────────────────────────

  async createCustomer(
    companyId: string,
    dto: CreateCustomerDto,
    db: Db = this.prisma,
  ) {
    const key = phoneKey(dto.phone);
    const email = this.clean(dto.email)?.toLowerCase() ?? null;

    if (!dto.allowDuplicatePhone) {
      const samePhone = await db.customer.findFirst({
        where: { companyId, phoneKey: key },
        select: { id: true, firstName: true, lastName: true },
      });
      if (samePhone) {
        throw new ConflictException({
          message: `${samePhone.firstName} ${samePhone.lastName} already has this phone number`,
          duplicateCustomerId: samePhone.id,
        });
      }
    }
    await this.assertEmailFree(companyId, email, undefined, db);

    return db.customer.create({
      data: {
        companyId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone.trim(),
        phoneKey: key,
        email,
        ghanaCardNumber: this.clean(dto.ghanaCardNumber)?.toUpperCase() ?? null,
        address: this.clean(dto.address),
        city: this.clean(dto.city),
        region: this.clean(dto.region),
        notes: this.clean(dto.notes),
      },
      select: customerSelect,
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async updateCustomer(companyId: string, id: string, dto: UpdateCustomerDto) {
    const existing = await this.prisma.customer.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Customer not found');

    const email =
      dto.email === undefined
        ? undefined
        : (this.clean(dto.email)?.toLowerCase() ?? null);
    if (email) await this.assertEmailFree(companyId, email, id);

    // `undefined` leaves a field alone; "" clears it
    const text = (v: string | undefined) =>
      v === undefined ? undefined : this.clean(v);
    const card = text(dto.ghanaCardNumber);

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
        ...(dto.phone !== undefined && {
          phone: dto.phone.trim(),
          phoneKey: phoneKey(dto.phone),
        }),
        ...(email !== undefined && { email }),
        ghanaCardNumber: card ? card.toUpperCase() : card,
        address: text(dto.address),
        city: text(dto.city),
        region: text(dto.region),
        notes: text(dto.notes),
      },
      select: customerSelect,
    });
  }

  // customers sharing a phone number with someone, newest first
  async findByPhone(companyId: string, phone: string) {
    return this.prisma.customer.findMany({
      where: { companyId, phoneKey: phoneKey(phone) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        city: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private clean(value: string | undefined | null) {
    const v = value?.trim();
    return v ? v : null;
  }

  private async assertEmailFree(
    companyId: string,
    email: string | null,
    exceptId?: string,
    db: Db = this.prisma,
  ) {
    if (!email) return;
    const taken = await db.customer.findFirst({
      where: { companyId, email, ...(exceptId && { NOT: { id: exceptId } }) },
      select: { id: true },
    });
    if (taken)
      throw new ConflictException('Another customer already uses this email');
  }
}
