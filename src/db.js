import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const envPath = fileURLToPath(new URL('./.env', import.meta.url));
const projectRoot = fileURLToPath(new URL('./', import.meta.url));
const execFileAsync = promisify(execFile);

if (existsSync(envPath)) {
  loadEnvFile(envPath);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

const targetDatabaseUrl = new URL(databaseUrl);
const targetDatabaseName = decodeURIComponent(
  targetDatabaseUrl.pathname.replace(/^\/+/, ''),
);

if (!['postgres:', 'postgresql:'].includes(targetDatabaseUrl.protocol)) {
  throw new Error('DATABASE_URL must use a PostgreSQL connection string');
}

if (!/^[A-Za-z_][A-Za-z0-9_$]*$/.test(targetDatabaseName)) {
  throw new Error(`Invalid PostgreSQL database name: ${targetDatabaseName}`);
}

const prisma = new PrismaClient();

const quoteIdentifier = (identifier) => `"${identifier.replaceAll('"', '""')}"`;

const applyMigrations = async () => {
  const prismaCli = fileURLToPath(
    new URL(
      `./node_modules/.bin/prisma${process.platform === 'win32' ? '.cmd' : ''}`,
      import.meta.url,
    ),
  );

  const { stdout, stderr } = await execFileAsync(
    prismaCli,
    ['migrate', 'deploy'],
    {
      cwd: projectRoot,
      env: process.env,
      maxBuffer: 1024 * 1024,
    },
  );

  if (stdout.trim()) {
    console.log(stdout.trim());
  }

  if (stderr.trim()) {
    console.error(stderr.trim());
  }
};

export const connectDatabase = async () => {
  if (targetDatabaseName !== 'postgres') {
    const maintenanceDatabaseUrl = new URL(targetDatabaseUrl);
    maintenanceDatabaseUrl.pathname = '/postgres';
    maintenanceDatabaseUrl.searchParams.delete('schema');

    const maintenancePrisma = new PrismaClient({
      datasources: {
        db: {
          url: maintenanceDatabaseUrl.toString(),
        },
      },
    });

    try {
      await maintenancePrisma.$connect();

      const existingDatabase = await maintenancePrisma.$queryRaw`
        SELECT 1 FROM pg_database WHERE datname = ${targetDatabaseName}
      `;

      if (existingDatabase.length === 0) {
        console.log(
          `PostgreSQL database "${targetDatabaseName}" does not exist. Creating it...`,
        );

        await maintenancePrisma.$executeRawUnsafe(
          `CREATE DATABASE ${quoteIdentifier(targetDatabaseName)}`,
        );
        console.log(`Created PostgreSQL database: ${targetDatabaseName}`);
      }
    } finally {
      await maintenancePrisma.$disconnect();
    }
  }

  await applyMigrations();
  await prisma.$connect();
};

export default prisma;
