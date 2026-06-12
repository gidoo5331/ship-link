import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompanyStaffService } from './staff.service';
import { JwtAuthGuard } from 'src/auth/guard';

@ApiTags('Company Staff')
@UseGuards(JwtAuthGuard)
@Controller('companies/:company_id/staff')
export class CompanyStaffController {
    constructor(private readonly companyStaffService: CompanyStaffService) {}

  @Get()
  findAll(@Param('company_id') companyId: string) {
    return this.companyStaffService.findCompanyStaff(companyId);
  }

}