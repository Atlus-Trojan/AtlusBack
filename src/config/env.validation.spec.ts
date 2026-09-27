import { envValidationSchema } from './env.validation';

interface EnvShape {
  PORT: number;
  NODE_ENV: string;
  LOG_LEVEL: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  CPF_ENCRYPTION_KEY: string;
  EMAIL_OTP_PROVIDER_KEY: string;
}

const validEnv: EnvShape = {
  PORT: 3000,
  NODE_ENV: 'development',
  LOG_LEVEL: 'log',
  DATABASE_URL: 'postgres://atlus:atlus@localhost:5432/atlus',
  JWT_SECRET: 'a'.repeat(32),
  JWT_EXPIRATION: '1d',
  CPF_ENCRYPTION_KEY: '0'.repeat(32),
  EMAIL_OTP_PROVIDER_KEY: 'otp-provider-key',
};

function validate(env: Partial<EnvShape>) {
  return envValidationSchema.validate(env, { abortEarly: false }) as {
    error?: { message: string };
    value: EnvShape;
  };
}

describe('envValidationSchema', () => {
  it('passes when all required variables are valid', () => {
    const { error, value } = validate(validEnv);
    expect(error).toBeUndefined();
    expect(value.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(value.JWT_SECRET).toBe(validEnv.JWT_SECRET);
  });

  it('fails with "Invalid or missing DATABASE_URL" when DATABASE_URL is absent', () => {
    const rest: Partial<EnvShape> = { ...validEnv };
    delete rest.DATABASE_URL;
    const { error } = validate(rest);
    expect(error?.message).toContain('Invalid or missing DATABASE_URL');
  });

  it('fails with "Invalid or missing DATABASE_URL" when DATABASE_URL is malformed', () => {
    const { error } = validate({ ...validEnv, DATABASE_URL: 'not-a-url' });
    expect(error?.message).toContain('Invalid or missing DATABASE_URL');
  });

  it('fails with "JWT_SECRET is required" when JWT_SECRET is absent', () => {
    const rest: Partial<EnvShape> = { ...validEnv };
    delete rest.JWT_SECRET;
    const { error } = validate(rest);
    expect(error?.message).toContain('JWT_SECRET is required');
  });

  it('fails when NODE_ENV is not one of the allowed values', () => {
    const { error } = validate({ ...validEnv, NODE_ENV: 'staging' });
    expect(error?.message).toContain(
      'NODE_ENV must be one of: development, production, test',
    );
  });

  it('fails with "CPF_ENCRYPTION_KEY must be exactly 32 characters" for wrong length', () => {
    const { error } = validate({ ...validEnv, CPF_ENCRYPTION_KEY: 'short' });
    expect(error?.message).toContain(
      'CPF_ENCRYPTION_KEY must be exactly 32 characters',
    );
  });

  it('defaults LOG_LEVEL to "log" when not provided', () => {
    const rest: Partial<EnvShape> = { ...validEnv };
    delete rest.LOG_LEVEL;
    const { error, value } = validate(rest);
    expect(error).toBeUndefined();
    expect(value.LOG_LEVEL).toBe('log');
  });

  it('defaults PORT to 3000 when not provided', () => {
    const rest: Partial<EnvShape> = { ...validEnv };
    delete rest.PORT;
    const { error, value } = validate(rest);
    expect(error).toBeUndefined();
    expect(value.PORT).toBe(3000);
  });
});
