import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from 'generated/prisma/client';
import { CompanyStaffService } from './staff.service';
import {
  CompanyScopeGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from 'src/auth/guard';
import { GetUser, RequirePermissions } from 'src/auth/decorator';
import { AddStaffDto, SetStaffActiveDto } from './dto/add-staff.dto';

@ApiTags('Company Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyScopeGuard, PermissionsGuard)
@Controller('companies/:company_id/staff')
export class CompanyStaffController {
  constructor(private readonly companyStaffService: CompanyStaffService) {}

  @Get()
  @ApiOperation({ summary: 'List the company admin and staff' })
  @RequirePermissions({ resource: 'staff', actions: ['read'] })
  findAll(@Param('company_id') companyId: string) {
    return this.companyStaffService.findCompanyStaff(companyId);
  }

  @Post()
  @ApiOperation({
    summary: 'Add a staff member',
    description:
      'Returns `temporaryPassword` once — pass it on; it is not stored in plain text.',
  })
  @RequirePermissions({ resource: 'staff', actions: ['create'] })
  addStaff(
    @Param('company_id') companyId: string,
    @Body() dto: AddStaffDto,
    @GetUser() user: User,
  ) {
    return this.companyStaffService.addStaff(companyId, dto, user);
  }

  @Patch(':id/active')
  @ApiOperation({ summary: 'Deactivate or reactivate a staff member' })
  @RequirePermissions({ resource: 'staff', actions: ['update'] })
  setActive(
    @Param('company_id') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetStaffActiveDto,
    @GetUser() user: User,
  ) {
    return this.companyStaffService.setActive(
      companyId,
      id,
      dto.isActive,
      user,
    );
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Give a staff member a new temporary password (returned once)',
  })
  @RequirePermissions({ resource: 'staff', actions: ['update'] })
  resetPassword(
    @Param('company_id') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.companyStaffService.resetPassword(companyId, id, user);
  }
}
