import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { RolesService } from 'src/roles/roles.service';
import { CompanySettingsController } from './company-settings.controller';
import { CompanySettingsService } from './company-settings.service';

@Module({
  controllers: [CompanyController, CompanySettingsController],
  providers: [CompanyService, RolesService, CompanySettingsService],
  exports: [CompanyService],
})
export class CompanyModule {}
