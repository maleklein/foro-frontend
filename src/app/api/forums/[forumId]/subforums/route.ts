// src/app/api/forums/[forumId]/subforums/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

type Params = { params: Promise<{ forumId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { forumId } = await params;

    // 1. Verificar que el foro exista
    const forum = await prisma.forum.findUnique({
      where: { id: forumId },
    });

    if (!forum) {
      return NextResponse.json({ error: 'Foro no encontrado' }, { status: 404 });
    }

    // 2. Consultar subforos asociados al foro
    const subforums = await prisma.subforum.findMany({
      where: { forumId },
      select: {
        id: true,
        name: true,
        description: true,
        tags: true,
        _count: {
          select: { threads: true },
        },
        threads: {
          select: {
            _count: {
              select: { comments: true },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    // 3. Calcular cantidad de comentarios totales por subforo
    const result = subforums.map((subforum) => {
      const totalComments = subforum.threads.reduce(
        (sum, thread) => sum + thread._count.comments,
        0
      );

      return {
        id: subforum.id,
        name: subforum.name,
        description: subforum.description,
        tags: subforum.tags,
        threadCount: subforum._count.threads,
        totalComments,
      };
    });

    // 4. Retornar 200 con lista de subforos
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error al obtener subforos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
