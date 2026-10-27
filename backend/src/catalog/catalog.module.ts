import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PublicCatalogController } from './public-catalog.controller';

@Module({
  controllers: [
    CategoriesController,
    ProductsController,
    PublicCatalogController,
  ],
  providers: [CategoriesService, ProductsService],
})
export class CatalogModule {}
