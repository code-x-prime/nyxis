import { prisma } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const configs = await prisma.storageConfig.findMany();
  console.log(JSON.stringify(configs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
