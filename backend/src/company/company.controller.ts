import {
  BadRequestException,
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
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto';
import { JwtAuthGuard, PermissionsGuard, SystemRoleGuard } from 'src/auth/guard';
import { SystemRole } from 'generated/prisma/enums';
import { GetUser, RequirePermissions, SystemRolesDecorator } from 'src/auth/decorator';
import type { User } from 'generated/prisma/client';
import { CreateCompanyDto } from 'src/auth/dto';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SystemRoleGuard)
@SystemRolesDecorator(SystemRole.SUPER_ADMIN)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  // ── Admin Create Approve company ─────────────────────────────────────────────────────
 @Post('/admin')
    createApprovedCompany(@Body() dto:CreateCompanyDto){
        return this.companyService.createApprovedCompany(dto)
    }

  // ── Get all companies ─────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  getCompanies() {
    return this.companyService.getCompanies();
  }

  // ── Get single company ────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a company by ID' })
  getCompany(@Param('id') id: string) {
    return this.companyService.getCompany(id);
  }

  // ── Update company profile ────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Update company profile' })
  updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companyService.updateCompany(id, dto);
  }

  // ── Update company status (approve / suspend / reinstate) ─────────────────

  @Patch(':id/status')
  @ApiOperation({ summary: 'Approve, suspend, or reinstate a company' })
  updateCompanyStatus(@Param('id') id: string, @Body() dto: UpdateCompanyStatusDto) {
    return this.companyService.updateCompanyStatus(id, dto);
  }

  // ── Delete company ────────────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a company' })
  deleteCompany(@Param('id') id: string) {
    return this.companyService.deleteCompany(id);
  }



// ── COMPANY_ADMIN + COMPANY_STAFF (with permission) ───────────────────────
  @Patch('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions({ resource: 'company', actions: ['update'] })
  @ApiOperation({ summary: 'Update own company profile' })
  updateMyCompany(
    @GetUser() user: User,
    @Body() dto: UpdateCompanyDto,
  ) {
    if (!user.companyId) {
      throw new BadRequestException('User is not assigned to a company');
    }

    return this.companyService.updateCompany(user.companyId, dto);
  }
}