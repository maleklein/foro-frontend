// src/app/api/users/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

type Params = { params: Promise<{ username: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { username } = await params;

    // 1. Buscar usuario por username con conteo de hilos y comentarios
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            threads: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 2. Calcular reputación: suma de votos en hilos y comentarios del usuario
    const [threadVotesResult, commentVotesResult] = await Promise.all([
      prisma.vote.aggregate({
        where: {
          targetType: 'Thread',
          thread: { authorId: user.id },
        },
        _sum: { value: true },
      }),
      prisma.vote.aggregate({
        where: {
          targetType: 'Comment',
          comment: { authorId: user.id },
        },
        _sum: { value: true },
      }),
    ]);

    const reputation =
      (threadVotesResult._sum.value ?? 0) + (commentVotesResult._sum.value ?? 0);

    // 3. Retornar perfil público + estadísticas
    const { _count, ...publicData } = user;

    return NextResponse.json(
      {
        ...publicData,
        stats: {
          threads: _count.threads,
          comments: _count.comments,
          reputation,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
