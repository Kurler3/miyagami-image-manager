import { PrismaClient } from '@prisma/client'

type IGlobal = typeof globalThis & {
  prisma?: PrismaClient;
};

const prisma = (global as IGlobal).prisma || new PrismaClient();

// Prevent re-instantiating PrismaClient in development mode
// This is only needed in dev, because of hot reloading to prevent multiple connections to the db from the same client.
if (process.env.NODE_ENV !== 'production') {
  (global as IGlobal).prisma = prisma;
}

export default prisma;