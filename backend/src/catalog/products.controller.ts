import {
  Body,
  Controller,
  Delete,
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
import type { User } from 'generated/prisma/client';
import {
  CompanyScopeGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from 'src/auth/guard';
import { GetUser, RequirePermissions } from 'src/auth/decorator';
import { ProductsService } from './products.service';
import type { ProductListQuery } from './products.service';
import {
  CreateImageUploadDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyScopeGuard, PermissionsGuard)
@Controller('companies/:companyId/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ── Get all products ──────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List products (archived hidden unless status=ARCHIVED)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  })
  @ApiQuery({
    name: 'availability',
    required: false,
    enum: ['AVAILABLE', 'ON_REQUEST', 'SOLD'],
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: "Category id, or 'none' for uncategorised",
  })
  @ApiQuery({ name: 'listing', required: false, enum: ['sale', 'rent'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @RequirePermissions({ resource: 'products', actions: ['read'] })
  getProducts(
    @Param('companyId') companyId: string,
    @Query() query: ProductListQuery,
  ) {
    return this.productsService.getProducts(companyId, query);
  }

  // ── Get single product ────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @RequirePermissions({ resource: 'products', actions: ['read'] })
  getProduct(
    @Param('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.getProduct(companyId, id);
  }

  // ── Create product (always a draft) ───────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a product — always starts as a draft' })
  @RequirePermissions({ resource: 'products', actions: ['create'] })
  createProduct(
    @Param('companyId') companyId: string,
    @Body() dto: CreateProductDto,
    @GetUser() user: User,
  ) {
    return this.productsService.createProduct(companyId, dto, user.id);
  }

  // ── Update product ────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Update product details, specs or image order' })
  @RequirePermissions({ resource: 'products', actions: ['update'] })
  updateProduct(
    @Param('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(companyId, id, dto);
  }

  // ── Delete product ────────────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product and its images' })
  @RequirePermissions({ resource: 'products', actions: ['delete'] })
  deleteProduct(
    @Param('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.deleteProduct(companyId, id);
  }

  // ── Publish / unpublish / archive ─────────────────────────────────────────

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Put a product on the website (422 lists what is missing)',
  })
  @RequirePermissions({ resource: 'products', actions: ['update'] })
  publishProduct(
    @Param('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.publishProduct(companyId, id);
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Take a product off the website (back to draft)' })
  @RequirePermissions({ resource: 'products', actions: ['update'] })
  unpublishProduct(
    @Param('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.unpublishProduct(companyId, id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive a product (hidden from the website and default lists)',
  })
  @RequirePermissions({ resource: 'products', actions: ['update'] })
  archiveProduct(
    @Param('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.archiveProduct(companyId, id);
  }

  // ── Image upload URL ──────────────────────────────────────────────────────

  @Post(':id/images/upload-url')
  @ApiOperation({
    summary: 'Get a presigned URL to upload a photo straight to storage',
    description:
      'PUT the file to `uploadUrl` with the same Content-Type, then PATCH the product with the new `key` in `images`.',
  })
  @RequirePermissions({ resource: 'products', actions: ['update'] })
  createImageUpload(
    @Param('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateImageUploadDto,
  ) {
    return this.productsService.createImageUpload(companyId, id, dto);
  }
}
