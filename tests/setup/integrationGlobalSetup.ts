import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer | undefined;

const prismaCli = fileURLToPath(
  new URL('../../node_modules/prisma/build/index.js', import.meta.url),
);

const runPrisma = (args: string[], extraEnv: NodeJS.ProcessEnv = {}) => {
  execFileSync(process.execPath, [prismaCli, ...args], {
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit',
  });
};

export async function setup() {
  container = await new PostgreSqlContainer('postgres:17-alpine').start();
  const connectionUri = container.getConnectionUri();
  process.env.DATABASE_URL = connectionUri;
  process.env.DIRECT_URL = connectionUri;

  runPrisma(['generate']);
  runPrisma(['db', 'push', '--accept-data-loss'], {
    PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION:
      'Consent: allow db push on test DB (Recommended)',
  });
}

export async function teardown() {
  await container?.stop();
}
