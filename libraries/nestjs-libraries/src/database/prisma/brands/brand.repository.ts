import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { BrandDto } from '@gitroom/nestjs-libraries/dtos/brands/brand.dto';

@Injectable()
export class BrandRepository {
  constructor(private _brand: PrismaRepository<'brand'>) {}

  getBrandsByOrgId(orgId: string) {
    return this._brand.model.brand.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  getBrandById(orgId: string, id: string) {
    return this._brand.model.brand.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
  }

  getDefaultBrand(orgId: string) {
    return this._brand.model.brand.findFirst({
      where: { organizationId: orgId, isDefault: true, deletedAt: null },
    });
  }

  async createOrUpdateBrand(orgId: string, brand: BrandDto, id?: string) {
    const values = {
      organizationId: orgId,
      name: brand.name,
      voicePrompt: brand.voicePrompt,
      languageRules: brand.languageRules,
      forbiddenWords: brand.forbiddenWords,
      hashtagGroups: brand.hashtagGroups,
      examplePosts: brand.examplePosts,
      primaryColor: brand.primaryColor,
      secondaryColor: brand.secondaryColor,
      defaultLanguage: brand.defaultLanguage || 'sv',
      allowedLanguages: brand.allowedLanguages || '["sv","en"]',
      approvalRequired: brand.approvalRequired || false,
      isDefault: brand.isDefault || false,
    };

    const { id: updatedId } = await this._brand.model.brand.upsert({
      where: { id: id || uuidv4(), organizationId: orgId },
      update: values,
      create: values,
    });

    if (values.isDefault) {
      await this._brand.model.brand.updateMany({
        where: { organizationId: orgId, id: { not: updatedId }, deletedAt: null },
        data: { isDefault: false },
      });
    }

    return { id: updatedId };
  }

  deleteBrand(orgId: string, id: string) {
    return this._brand.model.brand.update({
      where: { id, organizationId: orgId },
      data: { deletedAt: new Date() },
    });
  }
}
