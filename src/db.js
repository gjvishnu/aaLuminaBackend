import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const envPath = fileURLToPath(new URL('./.env', import.meta.url));

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

  await prisma.$connect();
};

export default prisma;
