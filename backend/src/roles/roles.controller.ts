import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from 'src/auth/guard';
import { RolesService } from './roles.service';
import { GetUser, RequirePermissions } from 'src/auth/decorator';
import type { User } from 'generated/prisma/client';
import { AssignRoleDto, CreateRoleDto, UpdateRoleDto } from './dto';


@ApiTags('Roles')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, CompanyScopeGuard, PermissionsGuard)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('companies/:companyId/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ── Get all roles ─────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all roles for a company' })
  @RequirePermissions({ resource: 'roles', actions: ['read'] })
  getAllRoles(@Param('companyId') companyId: string) {
    return this.rolesService.getAllRoles(companyId);
  }

  // ── Get single role ───────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  @RequirePermissions({ resource: 'roles', actions: ['read'] })
  getRole(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.rolesService.getRole(companyId, id);
  }

  // ── Create role ───────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @RequirePermissions({ resource: 'roles', actions: ['create'] })
  createRole(
    @Param('companyId') companyId: string,
    @Body() dto: CreateRoleDto,
    @GetUser() user: User,
  ) {
    return this.rolesService.createRole(companyId, dto, user);
  }

  // ── Update role ───────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role name, description, or permissions' })
  @RequirePermissions({ resource: 'roles', actions: ['update'] })
  updateRole(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @GetUser() user: User,
  ) {
    return this.rolesService.updateRole(companyId, id, dto, user);
  }

  // ── Delete role ───────────────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role — staff assigned to it must be reassigned first' })
  @RequirePermissions({ resource: 'roles', actions: ['delete'] })
  deleteRole(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.rolesService.deleteRole(companyId, id);
  }

  // ── Clone role ────────────────────────────────────────────────────────────

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a role with all its permissions' })
  @RequirePermissions({ resource: 'roles', actions: ['create'] })
  duplicateRole(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.duplicateRole(companyId, id, dto);
  }

  // ── Assign role to staff member ───────────────────────────────────────────

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign this role to a staff member' })
  @RequirePermissions({ resource: 'roles', actions: ['update'] })
  assignRole(
    @Param('companyId') companyId: string,
    @Param('id') roleId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.rolesService.assignRole(companyId, roleId, dto);
  }
}