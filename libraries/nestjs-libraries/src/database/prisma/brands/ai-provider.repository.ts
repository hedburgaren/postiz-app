import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AiProviderDto } from '@gitroom/nestjs-libraries/dtos/brands/ai-provider.dto';

@Injectable()
export class AiProviderRepository {
  constructor(private _aiProvider: PrismaRepository<'aiProvider'>) {}

  getProvidersByOrgId(orgId: string) {
    return this._aiProvider.model.aiProvider.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  getProviderById(orgId: string, id: string) {
    return this._aiProvider.model.aiProvider.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
  }

  getDefaultProvider(orgId: string) {
    return this._aiProvider.model.aiProvider.findFirst({
      where: { organizationId: orgId, isDefault: true, deletedAt: null },
    });
  }

  async createOrUpdateProvider(orgId: string, provider: AiProviderDto, id?: string) {
    const values = {
      organizationId: orgId,
      name: provider.name,
      providerType: provider.providerType as any,
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      isDefault: provider.isDefault || false,
      models: provider.models || '{}',
    };

    const { id: updatedId } = await this._aiProvider.model.aiProvider.upsert({
      where: { id: id || uuidv4(), organizationId: orgId },
      update: values,
      create: values,
    });

    if (values.isDefault) {
      await this._aiProvider.model.aiProvider.updateMany({
        where: { organizationId: orgId, id: { not: updatedId }, deletedAt: null },
        data: { isDefault: false },
      });
    }

    return { id: updatedId };
  }

  deleteProvider(orgId: string, id: string) {
    return this._aiProvider.model.aiProvider.update({
      where: { id, organizationId: orgId },
      data: { deletedAt: new Date() },
    });
  }
}
