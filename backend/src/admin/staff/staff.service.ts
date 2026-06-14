import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CompanyStaffService {
    constructor(private prisma: PrismaService ) {}

async findCompanyStaff(companyId: string) {
if (!companyId) {
    throw new BadRequestException('Company ID is required');
  }
  
  return this.prisma.user.findMany({
    where: {
      companyId,
      systemRole: { in: ['COMPANY_ADMIN', 'COMPANY_STAFF'] },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      systemRole: true,
      isActive: true,
      companyId: true,
      role: {
        select: { id: true, name: true },
      },
      createdAt: true,
    },
    orderBy: [
      { systemRole: 'asc' }, // COMPANY_ADMIN (owner) sorts first
      { createdAt: 'asc' },
    ],
  });
}

}