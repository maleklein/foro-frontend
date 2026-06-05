// src/lib/db/prisma.ts
// Cliente único de Prisma — lo importan todos los endpoints para hablar con la DB.

// PrismaClient es la clase que tiene todos los métodos para
// consultar la DB: prisma.user.findUnique(), prisma.user.create(), etc.
// La importamos desde la carpeta generated/prisma que Prisma
// generó automáticamente a partir del schema
import { PrismaClient } from '@/lib/generated/prisma';

// Importa el adaptador que conecta Prisma con SQLite
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Reserva un espacio en la memoria global de la app para guardar el cliente
const globalForPrisma = globalThis as { prisma?: PrismaClient };

// Crea un cliente nuevo conectado a la DB del archivo .env
function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

// Si ya existe un cliente lo reutiliza, si no crea uno nuevo.
// Garantiza que nunca haya más de una conexión abierta a la DB.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// En desarrollo: guarda el cliente en memoria global para que
// no se pierda cuando Next.js reinicia el servidor al guardar archivos.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}