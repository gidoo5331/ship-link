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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  CompanyScopeGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from 'src/auth/guard';
import { RequirePermissions } from 'src/auth/decorator';
import { LeadsService } from './leads.service';
import type { LeadListQuery } from './leads.service';
import {
  ConvertLeadDto,
  CreatePublicLeadDto,
  UpdateLeadDto,
} from './dto/lead.dto';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyScopeGuard, PermissionsGuard)
@Controller('companies/:companyId/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lead inbox, newest first, with a count per status',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'],
  })
  @ApiQuery({ name: 'type', required: false, enum: ['PURCHASE', 'RENTAL'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @RequirePermissions({ resource: 'leads', actions: ['read'] })
  getLeads(
    @Param('companyId') companyId: string,
    @Query() query: LeadListQuery,
  ) {
    return this.leadsService.getLeads(companyId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'A lead, plus existing customers with the same phone',
  })
  @RequirePermissions({ resource: 'leads', actions: ['read'] })
  getLead(
    @Param('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.leadsService.getLead(companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mark contacted / closed / new, or update notes' })
  @RequirePermissions({ resource: 'leads', actions: ['update'] })
  updateLead(
    @Param('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.updateLead(companyId, id, dto);
  }

  @Post(':id/convert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Convert to a customer — link `customerId` or create from `customer`',
  })
  @RequirePermissions(
    { resource: 'leads', actions: ['update'] },
    { resource: 'customers', actions: ['create'] },
  )
  convertLead(
    @Param('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertLeadDto,
  ) {
    return this.leadsService.convertLead(companyId, id, dto);
  }
}

// No auth — the company website's interest and request forms post here.
@ApiTags('Public leads')
@UseGuards(ThrottlerGuard)
@Controller('public/companies/:subdomain/leads')
export class PublicLeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Submit interest in a product, or a custom request (5/min per visitor)',
  })
  createLead(
    @Param('subdomain') subdomain: string,
    @Body() dto: CreatePublicLeadDto,
  ) {
    return this.leadsService.createPublicLead(subdomain, dto);
  }
}
