// src/company/company.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto';
import { CompanyStatus } from 'generated/prisma/enums';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

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