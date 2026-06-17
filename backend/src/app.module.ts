import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { CompanyModule } from './company/company.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true}), PrismaModule, AuthModule, AdminModule, CompanyModule, RolesModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
