// src/app/api/threads/[threadId]/vote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { extractUserIdFromToken } from '@/lib/auth/mock-token';

const voteBodySchema = z.object({
  value: z.number().refine((v) => v === 1 || v === -1, 'El voto debe ser +1 o -1'),
});

type Params = { params: Promise<{ threadId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { threadId } = await params;

    // 1. Validar header Authorization y extraer userId
    const userId = extractUserIdFromToken(req.headers.get('authorization'));

    if (!userId) {
      return NextResponse.json(
        { error: 'Token de autorización inválido o ausente' },
        { status: 401 }
      );
    }

    // 2. Validar body
    const body = await req.json();
    const validation = voteBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { value } = validation.data;

    // 3. Validar que el hilo exista y no esté eliminado
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true, authorId: true, status: true },
    });

    if (!thread || thread.status === 'deleted') {
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 });
    }

    // 4. Validar que el autor NO se vote a sí mismo
    if (thread.authorId === userId) {
      return NextResponse.json(
        { error: 'No puedes votar tu propio hilo' },
        { status: 403 }
      );
    }

    // 5. Buscar voto existente del usuario en ese hilo
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId: thread.id,
          targetType: 'Thread',
        },
      },
    });

    let userVote: number | null;

    // Las operaciones de escritura usan SQL crudo porque el schema de Vote tiene
    // tres FK constraints sobre el mismo campo targetId (Thread, Comment, File).
    // SQLite las verifica todas simultáneamente aunque el tipo sea solo Thread,
    // lo que provoca FK violation. PRAGMA foreign_keys = OFF es seguro aquí
    // porque la integridad ya fue validada manualmente arriba.
    if (!existingVote) {
      // No existe → crear
      const id = `cv${Date.now()}${Math.random().toString(36).slice(2, 9)}`;
      await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
      await prisma.$executeRaw`
        INSERT INTO Vote (id, userId, targetId, targetType, value, createdAt)
        VALUES (${id}, ${userId}, ${thread.id}, 'Thread', ${value}, datetime('now'))
      `;
      await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
      userVote = value;
    } else if (existingVote.value === value) {
      // Mismo valor → eliminar (toggle off)
      await prisma.$executeRaw`
        DELETE FROM Vote
        WHERE userId = ${userId} AND targetId = ${thread.id} AND targetType = 'Thread'
      `;
      userVote = null;
    } else {
      // Valor distinto → actualizar
      await prisma.$executeRaw`
        UPDATE Vote SET value = ${value}
        WHERE userId = ${userId} AND targetId = ${thread.id} AND targetType = 'Thread'
      `;
      userVote = value;
    }

    // 6. Recalcular contador total del hilo
    const votes = await prisma.vote.findMany({
      where: { targetId: thread.id, targetType: 'Thread' },
      select: { value: true },
    });

    const voteCount = votes.reduce((sum, v) => sum + v.value, 0);

    // 7. Retornar 200 con el nuevo contador total + estado del voto del usuario
    return NextResponse.json({ voteCount, userVote }, { status: 200 });
  } catch (error) {
    console.error('Error al votar hilo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
