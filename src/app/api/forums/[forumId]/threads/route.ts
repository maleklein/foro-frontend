// src/app/api/forums/[forumId]/threads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ThreadStatus } from '@/lib/generated/prisma';

type Params = { params: Promise<{ forumId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { forumId } = await params;

    // 1. Verificar que el foro exista
    const forum = await prisma.forum.findUnique({ where: { id: forumId } });

    if (!forum) {
      return NextResponse.json({ error: 'Foro no encontrado' }, { status: 404 });
    }

    // 2. Parsear query params
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') ?? 'recent';

    // 3. Construir filtro de estado
    const statusFilter =
      status === 'pinned'
        ? { pinned: true }
        : status === 'active' || status === 'closed'
          ? { status: status as ThreadStatus }
          : { status: { not: 'deleted' as ThreadStatus } };

    // 4. Consultar hilos del foro con datos necesarios para ordenar
    const threads = await prisma.thread.findMany({
      where: {
        subforum: { forumId },
        ...statusFilter,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        pinned: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, username: true, avatar: true },
        },
        _count: {
          select: { comments: true },
        },
        votes: {
          select: { value: true },
        },
        comments: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // 5. Ordenar según el parámetro sort
    const sorted = threads.sort((a, b) => {
      if (sort === 'votes') {
        const votesA = a.votes.reduce((sum, v) => sum + v.value, 0);
        const votesB = b.votes.reduce((sum, v) => sum + v.value, 0);
        return votesB - votesA;
      }
      if (sort === 'lastComment') {
        const lastA = a.comments[0]?.createdAt ?? a.createdAt;
        const lastB = b.comments[0]?.createdAt ?? b.createdAt;
        return lastB.getTime() - lastA.getTime();
      }
      // default: recent
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // 6. Paginar
    const total = sorted.length;
    const skip = (page - 1) * limit;
    const paginated = sorted.slice(skip, skip + limit);

    // 7. Mapear respuesta (sin exponer votos raw)
    const result = paginated.map(({ votes, comments, ...thread }) => ({
      ...thread,
      voteCount: votes.reduce((sum, v) => sum + v.value, 0),
      commentCount: thread._count.comments,
    }));

    // 8. Retornar 200 con paginación
    return NextResponse.json(
      {
        threads: result,
        page,
        limit,
        total,
        hasNext: skip + limit < total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al obtener hilos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
