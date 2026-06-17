import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { RolesService } from 'src/roles/roles.service';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService, RolesService],
  exports: [CompanyService],
})
export class CompanyModule {}
