import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from './dto';
import { SystemRole } from 'generated/prisma/enums';
import { User } from 'generated/prisma/client';
import { RESOURCES } from 'src/shared';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Find all ──────────────────────────────────────────────────────────────

  async getAllRoles(companyId: string) {
    return this.prisma.role.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: {
          select: { resource: true, actions: true },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Find one ──────────────────────────────────────────────────────────────

  async getRole(companyId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: {
          select: { resource: true, actions: true },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async createRole(
    companyId: string,
    dto: CreateRoleDto,
    user: User,
  ) {
    // check name unique within company
    await this.checkNameUnique(companyId, dto.name);

    // COMPANY_STAFF cannot grant permissions they don't have themselves
    if (user.systemRole === SystemRole.COMPANY_STAFF) {
      await this.validatePermissionsAgainstUser(dto.permissions, user);
    }

    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        companyId,
        permissions: {
          create: dto.permissions.map((p) => ({
            resource: p.resource,
            actions: p.actions,
          })),
        },
      },
      include: {
        permissions: true,
      },
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async updateRole(
    companyId: string,
    id: string,
    dto: UpdateRoleDto,
    user: User,
  ) {
    const role = await this.getRole(companyId, id);

    // prevent editing the default "Full Access" role name
    if (role.name === 'Full Access' && dto.name && dto.name !== 'Full Access') {
      throw new BadRequestException('Cannot rename the default Full Access role');
    }

    // check name unique if being changed
    if (dto.name && dto.name !== role.name) {
      await this.checkNameUnique(companyId, dto.name);
    }

    // COMPANY_STAFF cannot grant permissions they don't have
    if (
      user.systemRole === SystemRole.COMPANY_STAFF &&
      dto.permissions
    ) {
      await this.validatePermissionsAgainstUser(dto.permissions, user);
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        ...(dto.permissions && {
          permissions: {
            // delete existing and recreate — simplest way to replace permissions
            deleteMany: { roleId: id },
            create: dto.permissions.map((p) => ({
              resource: p.resource,
              actions: p.actions,
            })),
          },
        }),
      },
      include: { permissions: true },
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async deleteRole(companyId: string, id: string) {
    const role = await this.getRole(companyId, id);

    // prevent deleting "Full Access" default role
    if (role.name === 'Full Access') {
      throw new BadRequestException('Cannot delete the default Full Access role');
    }

    // prevent deleting a role that still has staff assigned
    if (role.users.length > 0) {
      throw new BadRequestException(
        `Cannot delete role — ${role.users.length} staff member(s) are still assigned to it. Reassign them first.`,
      );
    }

    return this.prisma.role.delete({ where: { id } });
  }

  // ── Clone ─────────────────────────────────────────────────────────────────

  async duplicateRole(companyId: string, id: string, dto: CreateRoleDto) {
    const source = await this.getRole(companyId, id);

    // new name must be unique
    await this.checkNameUnique(companyId, dto.name);

    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description ?? `Copy of ${source.name}`,
        companyId,
        permissions: {
          create: source.permissions.map((p) => ({
            resource: p.resource,
            actions: p.actions,
          })),
        },
      },
      include: { permissions: true },
    });
  }

  // ── Assign to staff member ────────────────────────────────────────────────

  async assignRole(companyId: string, roleId: string, dto: AssignRoleDto) {
    // ensure role belongs to this company
    await this.getRole(companyId, roleId);

    // ensure staff member exists and belongs to this company
    const staff = await this.prisma.user.findFirst({
      where: {
        id: dto.userId,
        companyId,
        systemRole: SystemRole.COMPANY_STAFF,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found in this company');
    }

    return this.prisma.user.update({
      where: { id: dto.userId },
      data: { roleId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: {
          select: { id: true, name: true, permissions: true },
        },
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async checkNameUnique(companyId: string, name: string) {
    const existing = await this.prisma.role.findFirst({
      where: { companyId, name },
    });
    if (existing) {
      throw new ConflictException(`A role named "${name}" already exists`);
    }
  }

  private async validatePermissionsAgainstUser(
    permissions: CreateRoleDto['permissions'],
    user: User,
  ) {
    if (!user.roleId) {
      throw new ForbiddenException('No role assigned to this account');
    }
    // load the staff member's own permissions
    const userPermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
    });

    for (const requested of permissions) {
      const own = userPermissions.find((p) => p.resource === requested.resource);
      const hasAll =
        own &&
        requested.actions.every((action) => own.actions.includes(action));

      if (!hasAll) {
        throw new ForbiddenException(
          `You cannot grant ${requested.resource}:${requested.actions.join(',')} — you don't have this permission yourself`,
        );
      }
    }
  }

  // ── Called internally on company creation ────────────────────────────────

  async createDefaultRoles(companyId: string) {
    return this.prisma.role.create({
      data: {
        name: 'Full Access',
        description: 'Complete control — equivalent to the owner except billing and account-level actions',
        companyId,
        permissions: {
          create: RESOURCES.map((resource) => ({
            resource,
            actions: ['create', 'read', 'update', 'delete'],
          })),
        },
      },
    });
  }
}