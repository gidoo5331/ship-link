import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CompanyScopeGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from 'src/auth/guard';
import { RequirePermissions } from 'src/auth/decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyScopeGuard, PermissionsGuard)
@Controller('companies/:companyId/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ── Get all categories ────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all product categories for a company' })
  @RequirePermissions({ resource: 'products', actions: ['read'] })
  getCategories(@Param('companyId') companyId: string) {
    return this.categoriesService.getCategories(companyId);
  }

  // ── Create category ───────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @RequirePermissions({ resource: 'products', actions: ['create'] })
  createCategory(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.createCategory(companyId, dto);
  }

  // ── Add starter set ───────────────────────────────────────────────────────

  @Post('starter')
  @ApiOperation({
    summary: 'Add the starter categories (only when the company has none)',
  })
  @RequirePermissions({ resource: 'products', actions: ['create'] })
  createStarterCategories(@Param('companyId') companyId: string) {
    return this.categoriesService.createStarterCategories(companyId);
  }

  // ── Update category ───────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a category or change its spec template' })
  @RequirePermissions({ resource: 'products', actions: ['update'] })
  updateCategory(
    @Param('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(companyId, id, dto);
  }

  // ── Delete category ───────────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a category — its products become uncategorised',
  })
  @RequirePermissions({ resource: 'products', actions: ['delete'] })
  deleteCategory(
    @Param('companyId') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.deleteCategory(companyId, id);
  }
}
