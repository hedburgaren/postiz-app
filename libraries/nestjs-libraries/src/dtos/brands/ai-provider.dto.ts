import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum AiProviderTypeDto {
  OPENAI = 'OPENAI',
  GROQ = 'GROQ',
  ANTHROPIC = 'ANTHROPIC',
  OLLAMA = 'OLLAMA',
  CUSTOM = 'CUSTOM',
}

export class AiProviderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name: string;

  @IsEnum(AiProviderTypeDto)
  providerType: AiProviderTypeDto;

  @IsString()
  @MinLength(1)
  apiKey: string;

  @IsString()
  @IsOptional()
  baseUrl?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  models?: string;
}
