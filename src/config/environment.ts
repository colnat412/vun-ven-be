import { plainToInstance } from 'class-transformer';
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
  @IsInt() @Min(1) @Max(65535) PORT = 3000;
  @IsString() @IsNotEmpty() CORS_ORIGIN!: string;
  @IsString() @IsNotEmpty() DB_HOST!: string;
  @IsInt() @Min(1) @Max(65535) DB_PORT = 3306;
  @IsString() @IsNotEmpty() DB_USERNAME!: string;
  @IsString() @IsNotEmpty() DB_PASSWORD!: string;
  @IsString() @IsNotEmpty() DB_NAME!: string;
  @IsString() @MinLength(32) JWT_SECRET!: string;
  @IsInt() @Min(60) @Max(86400) JWT_EXPIRES_IN_SECONDS = 900;
}

export const validateEnvironment = (
  input: Record<string, unknown>,
): Environment => {
  const env = plainToInstance(Environment, input, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length)
    throw new Error(
      `Invalid environment: ${errors.map((error) => error.property).join(', ')}`,
    );
  return env;
};
