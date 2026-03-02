import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { CheckPolicies } from '@gitroom/backend/services/auth/permissions/permissions.ability';
import { AuthorizationActions, Sections } from '@gitroom/backend/services/auth/permissions/permission.exception.class';
import { BrandService } from '@gitroom/nestjs-libraries/database/prisma/brands/brand.service';
import { AiProviderService } from '@gitroom/nestjs-libraries/database/prisma/brands/ai-provider.service';
import { BrandDto } from '@gitroom/nestjs-libraries/dtos/brands/brand.dto';
import { AiProviderDto } from '@gitroom/nestjs-libraries/dtos/brands/ai-provider.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Brands')
@Controller('/brands')
export class BrandsController {
  constructor(
    private _brandService: BrandService,
    private _aiProviderService: AiProviderService
  ) {}

  // ── Brand CRUD ──────────────────────────────────────────────

  @Get('/')
  async getBrands(@GetOrgFromRequest() org: Organization) {
    return this._brandService.getBrandsByOrgId(org.id);
  }

  @Get('/:id')
  async getBrand(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._brandService.getBrandById(org.id, id);
  }

  @Post('/')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  async createBrand(
    @GetOrgFromRequest() org: Organization,
    @Body() body: BrandDto
  ) {
    return this._brandService.createOrUpdateBrand(org.id, body);
  }

  @Put('/:id')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  async updateBrand(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: BrandDto
  ) {
    return this._brandService.createOrUpdateBrand(org.id, body, id);
  }

  @Delete('/:id')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  async deleteBrand(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._brandService.deleteBrand(org.id, id);
  }

  // ── AI Provider CRUD ────────────────────────────────────────

  @Get('/ai-providers/list')
  async getAiProviders(@GetOrgFromRequest() org: Organization) {
    return this._aiProviderService.getProvidersByOrgId(org.id);
  }

  @Get('/ai-providers/:id')
  async getAiProvider(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._aiProviderService.getProviderById(org.id, id);
  }

  @Post('/ai-providers')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  async createAiProvider(
    @GetOrgFromRequest() org: Organization,
    @Body() body: AiProviderDto
  ) {
    return this._aiProviderService.createOrUpdateProvider(org.id, body);
  }

  @Put('/ai-providers/:id')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  async updateAiProvider(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: AiProviderDto
  ) {
    return this._aiProviderService.createOrUpdateProvider(org.id, body, id);
  }

  @Delete('/ai-providers/:id')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  async deleteAiProvider(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._aiProviderService.deleteProvider(org.id, id);
  }
}
