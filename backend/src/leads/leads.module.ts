import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomersModule } from 'src/customers/customers.module';
import { LeadsController, PublicLeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  // defaults for the public form; the route sets its own limit
  imports: [
    CustomersModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
  ],
  controllers: [LeadsController, PublicLeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
