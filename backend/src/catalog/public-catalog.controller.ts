import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

// No auth — read by each company's public website.
// Only approved companies and published products are visible.
@ApiTags('Public catalog')
@Controller('public/companies/:subdomain')
export class PublicCatalogController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Company details for its website' })
  getCompany(@Param('subdomain') subdomain: string) {
    return this.productsService.getPublicCompany(subdomain);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Categories that have at least one listed product' })
  getCategories(@Param('subdomain') subdomain: string) {
    return this.productsService.getPublicCategories(subdomain);
  }

  @Get('products')
  @ApiOperation({ summary: 'Published products that are not sold' })
  @ApiQuery({ name: 'category', required: false, description: 'Category slug' })
  @ApiQuery({
    name: 'listing',
    required: false,
    enum: ['sale', 'rent'],
    description: 'Only for sale, or only for rent (when the company rents)',
  })
  getProducts(
    @Param('subdomain') subdomain: string,
    @Query('category') category?: string,
    @Query('listing') listing?: string,
  ) {
    return this.productsService.getPublicProducts(subdomain, category, listing);
  }

  @Get('products/:slug')
  @ApiOperation({
    summary: 'A published product (sold products still resolve)',
  })
  getProduct(
    @Param('subdomain') subdomain: string,
    @Param('slug') slug: string,
  ) {
    return this.productsService.getPublicProduct(subdomain, slug);
  }
}
