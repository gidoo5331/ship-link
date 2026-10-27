import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CompanyScopeGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from 'src/auth/guard';
import { RequirePermissions } from 'src/auth/decorator';
import { CompanySettingsService } from './company-settings.service';
import {
  CreateLogoUploadDto,
  UpdateCompanySettingsDto,
} from './dto/update-company-settings.dto';

@ApiTags('Company settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyScopeGuard, PermissionsGuard)
@Controller('companies/:companyId/settings')
export class CompanySettingsController {
  constructor(private readonly settingsService: CompanySettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Company profile and public website content' })
  @RequirePermissions({ resource: 'company', actions: ['read'] })
  getSettings(@Param('companyId') companyId: string) {
    return this.settingsService.getSettings(companyId);
  }

  @Patch()
  @ApiOperation({
    summary: 'Update company profile and website content ("" clears a field)',
  })
  @RequirePermissions({ resource: 'company', actions: ['update'] })
  updateSettings(
    @Param('companyId') companyId: string,
    @Body() dto: UpdateCompanySettingsDto,
  ) {
    return this.settingsService.updateSettings(companyId, dto);
  }

  @Post('logo/upload-url')
  @ApiOperation({
    summary: 'Presigned URL to upload a logo (max 2 MB)',
    description:
      'PUT the file to `uploadUrl`, then PATCH settings with `logoUrl` set to the returned `url`.',
  })
  @RequirePermissions({ resource: 'company', actions: ['update'] })
  createLogoUpload(
    @Param('companyId') companyId: string,
    @Body() dto: CreateLogoUploadDto,
  ) {
    return this.settingsService.createLogoUpload(companyId, dto);
  }
}
