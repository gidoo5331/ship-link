import { Module } from '@nestjs/common';
import { CompanyStaffController } from './staff/staff.controller';
import { CompanyStaffService } from './staff/staff.service';
import { SuperAdminController } from './super-admin/super-admin.controller';

@Module({
  providers: [CompanyStaffService],
  controllers: [CompanyStaffController, SuperAdminController]
})
export class AdminModule {}
