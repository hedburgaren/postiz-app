import { Injectable } from '@nestjs/common';
import { AiProviderRepository } from '@gitroom/nestjs-libraries/database/prisma/brands/ai-provider.repository';
import { AiProviderDto } from '@gitroom/nestjs-libraries/dtos/brands/ai-provider.dto';

@Injectable()
export class AiProviderService {
  constructor(private _aiProviderRepository: AiProviderRepository) {}

  getProvidersByOrgId(orgId: string) {
    return this._aiProviderRepository.getProvidersByOrgId(orgId);
  }

  getProviderById(orgId: string, id: string) {
    return this._aiProviderRepository.getProviderById(orgId, id);
  }

  getDefaultProvider(orgId: string) {
    return this._aiProviderRepository.getDefaultProvider(orgId);
  }

  createOrUpdateProvider(orgId: string, provider: AiProviderDto, id?: string) {
    return this._aiProviderRepository.createOrUpdateProvider(orgId, provider, id);
  }

  deleteProvider(orgId: string, id: string) {
    return this._aiProviderRepository.deleteProvider(orgId, id);
  }
}
