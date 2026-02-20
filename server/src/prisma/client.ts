import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export default prisma;