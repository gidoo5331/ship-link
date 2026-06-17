import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto';
import { CompanyStatus, SystemRole } from 'generated/prisma/enums';
import { CreateCompanyDto } from 'src/auth/dto';
import * as argon from 'argon2'
import { randomBytes } from 'crypto'
import { RolesService } from 'src/roles/roles.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { RESOURCES } from 'src/shared';


@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService,
    private readonly rolesService: RolesService,) {}

  // ── Called by AuthService (POST /auth/register-company)
  // status = PENDING — waits for super admin approval
  async createCompany(dto: CreateCompanyDto) {
    return this._createCompany(dto, CompanyStatus.PENDING);
  }

  // ── Called by CompanyController (POST /companies — SUPER_ADMIN)
  // status = APPROVED — no approval needed
  async createApprovedCompany(dto: CreateCompanyDto) {
    return this._createCompany(dto, CompanyStatus.APPROVED);
  }

  private async _createCompany(dto: CreateCompanyDto, status: CompanyStatus) {
    const subdomain = dto.subdomain ?? dto.company_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Generate a temp password
    const rawPassword = randomBytes(4).toString('hex') // e.g. "a3f9bc12"
    const passwordHash = await argon.hash(rawPassword);

    try {
        return this.prisma.$transaction(async (tx) => {
      // step 1 — create company
      const company = await tx.company.create({
        data: {
          name: dto.company_name,
          subdomain,
          email: dto.company_email,
          phone: dto.company_phone,
          status,
          users: {
            create: {
              firstName: dto.first_name,
              lastName: dto.last_name,
              email: dto.email,
              phone: dto.phone,
              password: passwordHash,
              systemRole: SystemRole.COMPANY_ADMIN,
            },
          },
        },
         include: {
            users: true,
        },
      });

      // step 2 — create default "Full Access" role for the company
    //  const role = await this.rolesService.createDefaultRoles(company.id);
     const role = await tx.role.create({
  data: {
    name: 'Full Access',
    description:
      'Complete control — equivalent to the owner except billing and account-level actions',
    companyId: company.id,
    permissions: {
      create: RESOURCES.map((resource) => ({
        resource,
        actions: ['create', 'read', 'update', 'delete'],
      })),
    },
  },
});
      await tx.user.update({
    where: {
      id: company.users[0].id,
    },
    data: {
      roleId: role.id,
    },
  });
      // return message + temp password if it was auto-generated
      // (AuthService will email this to the owner)
      return {
        message: status === CompanyStatus.PENDING ? 'Registration submitted. Awaiting approval.' : 'Company created and approved.',
      }});
    } catch (error) {
       if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
                const fields: string[] = (error.meta as any)?.driverAdapterError?.cause?.constraint?.fields ?? []
                if (fields.includes('email')) throw new ConflictException('Email already in use')
                if (fields.includes('subdomain')) throw new ConflictException('Subdomain already taken')
                throw new ConflictException('A unique constraint was violated')
            }
      throw error;
    }
  }


  // ── Find all companies (SUPER_ADMIN) ──────────────────────────────────────

  async getCompanies() {
    return this.prisma.company.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        email: true,
        phone: true,
        address: true,
        logoUrl: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            agents: true,
            customers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Find one company ──────────────────────────────────────────────────────

  async getCompany(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
        status: true,
        email: true,
        phone: true,
        address: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            agents: true,
            customers: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company not found`);
    }

    return company;
  }

  // ── Find by subdomain (used by JWT strategy + web app middleware) ─────────

  async findBySubdomain(subdomain: string) {
    const company = await this.prisma.company.findUnique({
      where: { subdomain },
    });

    if (!company) {
      throw new NotFoundException(`Company not found`);
    }

    return company;
  }

  // ── Update company profile ────────────────────────────────────────────────

  async updateCompany(id: string, dto: UpdateCompanyDto) {
    await this.getCompany(id); // ensure exists

    // if subdomain is being changed, check it's not already taken
    if (dto.subdomain) {
      const existing = await this.prisma.company.findUnique({
        where: { subdomain: dto.subdomain },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Subdomain is already taken');
      }
    }

    return this.prisma.company.update({
      where: { id },
      data: {
        ...(dto.company_name && { name: dto.company_name }),
        ...(dto.subdomain && { subdomain: dto.subdomain }),
        ...(dto.company_email && { email: dto.company_email }),
        ...(dto.company_phone && { phone: dto.company_phone }),
        ...(dto.address && { address: dto.address }),
        ...(dto.logoUrl && { logoUrl: dto.logoUrl }),
      },
    });
  }

  // ── Update company status (SUPER_ADMIN) ───────────────────────────────────

  async updateCompanyStatus(id: string, dto: UpdateCompanyStatusDto) {
    const company = await this.getCompany(id);

    // prevent redundant status updates
    if (company.status === dto.status) {
      throw new BadRequestException(
        `Company is already ${dto.status.toLowerCase()}`,
      );
    }

    // PENDING companies can only be APPROVED, not directly SUSPENDED
    if (
      company.status === CompanyStatus.PENDING &&
      dto.status === CompanyStatus.SUSPENDED
    ) {
      throw new BadRequestException(
        'A pending company must be approved before it can be suspended',
      );
    }

    return this.prisma.company.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // ── Delete company (SUPER_ADMIN) ──────────────────────────────────────────

  async deleteCompany(id: string) {
    await this.getCompany(id); // ensure exists

    return this.prisma.company.delete({
      where: { id },
    });
  }
}