import { plainToInstance, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

class Environment {
  @IsIn(['development', 'test', 'production']) NODE_ENV = 'development';
  @Type(() => Number) @IsInt() @Min(1) @Max(65535) PORT: number = 3000;
  @IsString() @IsNotEmpty() CORS_ORIGIN!: string;
  @IsString() @IsNotEmpty() DB_HOST!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(65535) DB_PORT: number = 3306;
  @IsString() @IsNotEmpty() DB_USERNAME!: string;
  @IsString() @IsNotEmpty() DB_PASSWORD!: string;
  @IsString() @IsNotEmpty() DB_NAME!: string;
  @IsString() @MinLength(32) JWT_SECRET!: string;
  @Type(() => Number) @IsInt() @Min(60) @Max(86400) JWT_EXPIRES_IN_SECONDS: number = 900;
  @IsString()
  @IsNotEmpty()
  GEMINI_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  GEMINI_MODEL: string;

  @Type(() => Number)
  @IsInt()
  @Min(1000)
  @Max(60000)
  GEMINI_TIMEOUT_MS: number = 15000;
}

export const validateEnvironment = (
  input: Record<string, unknown>,
): Environment => {
  const env = plainToInstance(Environment, input, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(env, { skipMissingProperties: false });
  const cloudinaryKeys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  if (cloudinaryKeys.some(key => !!input[key]) && cloudinaryKeys.some(key => typeof input[key] !== 'string' || !String(input[key]).trim())) {
    throw new Error('Cloudinary configuration requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
  }
  if (errors.length)
    throw new Error(
      `Invalid environment: ${errors.map((error) => error.property).join(', ')}`,
    );
  return env;
};
