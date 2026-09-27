import { spawn } from 'child_process';
import { join } from 'path';

const VALID_ENV = {
  NODE_ENV: 'development',
  LOG_LEVEL: 'log',
  JWT_SECRET: 'e2e-test-secret-that-is-32-chars',
  JWT_EXPIRATION: '1d',
  CPF_ENCRYPTION_KEY: '0'.repeat(32),
  EMAIL_OTP_PROVIDER_KEY: 'e2e-otp-provider-key',
};

function runBootstrap(env: Record<string, string | undefined>) {
  return new Promise<{ exitCode: number | null; output: string }>((resolve) => {
    const child = spawn(
      process.execPath,
      [
        '-r',
        'ts-node/register',
        '-r',
        'tsconfig-paths/register',
        join(__dirname, '..', 'src', 'main.ts'),
      ],
      {
        cwd: join(__dirname, '..'),
        env: { ...process.env, ...env },
      },
    );

    let output = '';
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));

    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ exitCode: null, output: output + '\n[timed out]' });
    }, 15000);

    child.on('exit', (exitCode) => {
      clearTimeout(timeout);
      resolve({ exitCode, output });
    });
  });
}

describe('Bootstrap fail-fast (e2e)', () => {
  it('exits with a non-zero code and an explicit error when DATABASE_URL is missing', async () => {
    const env = { ...VALID_ENV, DATABASE_URL: undefined };
    const { exitCode, output } = await runBootstrap(env);

    expect(exitCode).not.toBe(0);
    expect(exitCode).not.toBeNull();
    expect(output).toContain('Invalid or missing DATABASE_URL');
    expect(output).not.toContain('Nest application successfully started');
  }, 20000);

  it('exits with a non-zero code and an explicit error when DATABASE_URL is malformed', async () => {
    const env = { ...VALID_ENV, DATABASE_URL: 'not-a-valid-url' };
    const { exitCode, output } = await runBootstrap(env);

    expect(exitCode).not.toBe(0);
    expect(exitCode).not.toBeNull();
    expect(output).toContain('Invalid or missing DATABASE_URL');
    expect(output).not.toContain('Nest application successfully started');
  }, 20000);
});
