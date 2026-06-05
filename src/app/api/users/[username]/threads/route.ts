// src/app/api/users/[username]/threads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

type Params = { params: Promise<{ username: string }> };

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseQueryParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || DEFAULT_LIMIT)
  );
  const sort = searchParams.get('sort') === 'votes' ? 'votes' : 'recent';
  return { page, limit, sort };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { username } = await params;
    const { page, limit, sort } = parseQueryParams(req.nextUrl.searchParams);

    // 1. Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 2. Traer todos los hilos del usuario con votos y conteo de comentarios
    // Se trae todo para poder ordenar por suma de votos en memoria
    const rawThreads = await prisma.thread.findMany({
      where: { authorId: user.id },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        pinned: true,
        createdAt: true,
        subforum: {
          select: {
            id: true,
            name: true,
            forum: {
              select: { id: true, name: true },
            },
          },
        },
        votes: { select: { value: true } },
        _count: { select: { comments: true } },
      },
    });

    // 3. Calcular suma de votos por hilo y aplanar la estructura
    const threads = rawThreads.map(({ votes, _count, ...thread }) => ({
      ...thread,
      votes: votes.reduce((sum, v) => sum + v.value, 0),
      comments: _count.comments,
    }));

    // 4. Ordenar según parámetro sort
    const sorted =
      sort === 'votes'
        ? threads.sort((a, b) => b.votes - a.votes)
        : threads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 5. Paginar manualmente
    const total = sorted.length;
    const paginated = sorted.slice((page - 1) * limit, page * limit);

    return NextResponse.json(
      {
        threads: paginated,
        page,
        limit,
        total,
        hasNext: page * limit < total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al obtener hilos del usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
