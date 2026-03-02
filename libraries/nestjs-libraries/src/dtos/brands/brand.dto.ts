import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class BrandDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name: string;

  @IsString()
  @IsOptional()
  voicePrompt?: string;

  @IsString()
  @IsOptional()
  languageRules?: string;

  @IsString()
  @IsOptional()
  forbiddenWords?: string;

  @IsString()
  @IsOptional()
  hashtagGroups?: string;

  @IsString()
  @IsOptional()
  examplePosts?: string;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  primaryColor?: string;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  secondaryColor?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  defaultLanguage?: string;

  @IsString()
  @IsOptional()
  allowedLanguages?: string;

  @IsBoolean()
  @IsOptional()
  approvalRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
