import {
  Body,
  Controller,
  Get,
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
import {
  CompanyScopeGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from 'src/auth/guard';
import { RequirePermissions } from 'src/auth/decorator';
import { CustomersService } from './customers.service';
import type { CustomerListQuery } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyScopeGuard, PermissionsGuard)
@Controller('companies/:companyId/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customers (search by name, email or phone)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @RequirePermissions({ resource: 'customers', actions: ['read'] })
  getCustomers(
    @Param('companyId') companyId: string,
    @Query() query: CustomerListQuery,
  ) {
    return this.customersService.getCustomers(companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'A customer and their enquiries' })
  @RequirePermissions({ resource: 'customers', actions: ['read'] })
  getCustomer(
    @Param('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customersService.getCustomer(companyId, id);
  }

  @Post()
  @ApiOperation({
    summary:
      'Add a customer (409 with duplicateCustomerId if the phone is taken)',
  })
  @RequirePermissions({ resource: 'customers', actions: ['create'] })
  createCustomer(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.createCustomer(companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer ("" clears an optional field)' })
  @RequirePermissions({ resource: 'customers', actions: ['update'] })
  updateCustomer(
    @Param('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.updateCustomer(companyId, id, dto);
  }
}
