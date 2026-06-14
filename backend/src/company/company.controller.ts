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
import { SystemRoleGuard } from '../auth/guards/system-role.guard';
import { SystemRoles } from '../auth/decorators/system-roles.decorator';
import { SystemRole } from '@prisma/client';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto';
import { JwtAuthGuard } from 'src/auth/guard';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SystemRoleGuard)
@SystemRoles(SystemRole.SUPER_ADMIN)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

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

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Get own company profile' })
  getMyCompany(@GetUser() user: CurrentUserPayload) {
    return this.companyService.findOne(user.companyId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions({ resource: 'company', actions: ['update'] })
  @ApiOperation({ summary: 'Update own company profile' })
  updateMyCompany(
    @GetUser() user: CurrentUserPayload,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companyService.update(user.companyId, dto);
  }
}