import { Injectable } from '@nestjs/common';
import { BrandRepository } from '@gitroom/nestjs-libraries/database/prisma/brands/brand.repository';
import { BrandDto } from '@gitroom/nestjs-libraries/dtos/brands/brand.dto';

@Injectable()
export class BrandService {
  constructor(private _brandRepository: BrandRepository) {}

  getBrandsByOrgId(orgId: string) {
    return this._brandRepository.getBrandsByOrgId(orgId);
  }

  getBrandById(orgId: string, id: string) {
    return this._brandRepository.getBrandById(orgId, id);
  }

  getDefaultBrand(orgId: string) {
    return this._brandRepository.getDefaultBrand(orgId);
  }

  createOrUpdateBrand(orgId: string, brand: BrandDto, id?: string) {
    return this._brandRepository.createOrUpdateBrand(orgId, brand, id);
  }

  deleteBrand(orgId: string, id: string) {
    return this._brandRepository.deleteBrand(orgId, id);
  }
}
