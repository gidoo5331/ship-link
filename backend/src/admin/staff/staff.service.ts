import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon from 'argon2';
import { randomBytes } from 'crypto';
import type { User } from 'generated/prisma/client';
import { SystemRole } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddStaffDto } from './dto/add-staff.dto';

const staffSelect = {
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
} as const;

// 12 readable characters, shown to the admin once to pass on
function temporaryPassword() {
  return randomBytes(9).toString('base64url');
}

@Injectable()
export class CompanyStaffService {
  constructor(private prisma: PrismaService) {}

  // ── List ──────────────────────────────────────────────────────────────────

  async findCompanyStaff(companyId: string) {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }

    return this.prisma.user.findMany({
      where: {
        companyId,
        systemRole: { in: ['COMPANY_ADMIN', 'COMPANY_STAFF'] },
      },
      select: staffSelect,
      orderBy: [
        { systemRole: 'asc' }, // COMPANY_ADMIN (owner) sorts first
        { createdAt: 'asc' },
      ],
    });
  }

  // ── Add — returns a temporary password once ───────────────────────────────

  async addStaff(companyId: string, dto: AddStaffDto, actor: User) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing)
      throw new ConflictException(
        'Someone with this email already has an account',
      );

    const role = dto.roleId
      ? await this.prisma.role.findFirst({
          where: { id: dto.roleId, companyId },
        })
      : await this.prisma.role.findFirst({
          where: { companyId, name: 'Full Access' },
        });
    if (!role) {
      throw new BadRequestException(
        dto.roleId
          ? 'Role not found'
          : 'This company has no "Full Access" role',
      );
    }

    await this.assertCanGrantRole(actor, role.id);

    const password = temporaryPassword();
    const staff = await this.prisma.user.create({
      data: {
        companyId,
        systemRole: SystemRole.COMPANY_STAFF,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        phone: dto.phone?.trim() || null,
        password: await argon.hash(password),
        roleId: role.id,
      },
      select: staffSelect,
    });

    return { staff, temporaryPassword: password };
  }

  // ── Deactivate / reactivate ───────────────────────────────────────────────

  async setActive(
    companyId: string,
    userId: string,
    isActive: boolean,
    actor: User,
  ) {
    const target = await this.findStaffMember(companyId, userId, actor);

    if (!isActive && target.id === actor.id) {
      throw new BadRequestException("You can't deactivate your own account");
    }

    return this.prisma.user.update({
      where: { id: target.id },
      data: { isActive },
      select: staffSelect,
    });
  }

  // ── Reset password — returns a new temporary password once ────────────────

  async resetPassword(companyId: string, userId: string, actor: User) {
    const target = await this.findStaffMember(companyId, userId, actor);

    const password = temporaryPassword();
    await this.prisma.user.update({
      where: { id: target.id },
      data: { password: await argon.hash(password) },
    });

    return { temporaryPassword: password };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  // Only COMPANY_STAFF members can be managed here; the company admin can't.
  private async findStaffMember(
    companyId: string,
    userId: string,
    actor: User,
  ) {
    const target = await this.prisma.user.findFirst({
      where: { id: userId, companyId },
      select: { id: true, systemRole: true, roleId: true },
    });
    if (!target) throw new NotFoundException('Staff member not found');
    if (target.systemRole !== SystemRole.COMPANY_STAFF) {
      throw new ForbiddenException(
        "The company admin's account can't be changed here",
      );
    }
    if (target.roleId) await this.assertCanGrantRole(actor, target.roleId);
    return target;
  }

  // A staff member can only add or manage people whose role doesn't exceed
  // their own permissions. Admins can manage everyone.
  private async assertCanGrantRole(actor: User, roleId: string) {
    if (actor.systemRole !== SystemRole.COMPANY_STAFF) return;
    if (!actor.roleId)
      throw new ForbiddenException('No role assigned to this account');

    const [own, target] = await Promise.all([
      this.prisma.rolePermission.findMany({ where: { roleId: actor.roleId } }),
      this.prisma.rolePermission.findMany({ where: { roleId } }),
    ]);

    for (const permission of target) {
      const mine = own.find((p) => p.resource === permission.resource);
      if (!mine || !permission.actions.every((a) => mine.actions.includes(a))) {
        throw new ForbiddenException(
          `You can't give someone ${permission.resource}:${permission.actions.join(',')} — you don't have it yourself`,
        );
      }
    }
  }
}
