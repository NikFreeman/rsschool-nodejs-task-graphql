import { PrismaClient } from '@prisma/client';
import { dataLoaders } from '../schema.js';

export interface Context {
  prisma: PrismaClient;
  dl: ReturnType<typeof dataLoaders>;
}
