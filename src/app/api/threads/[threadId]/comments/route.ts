// src/app/api/threads/[threadId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { extractUserIdFromToken } from '@/lib/auth/mock-token';
import { createCommentSchema } from '@/lib/validations';

type Params = { params: Promise<{ threadId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { threadId } = await params;

    // 1. Validar header Authorization
    const userId = extractUserIdFromToken(req.headers.get('authorization'));

    if (!userId) {
      return NextResponse.json(
        { error: 'Token de autorización inválido o ausente' },
        { status: 401 }
      );
    }

    // 2. Verificar usuario autenticado + emailVerified + antigüedad 24h
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, createdAt: true },
    });

    if (!user || !user.emailVerified) {
      return NextResponse.json(
        { error: 'Debes verificar tu email para comentar' },
        { status: 403 }
      );
    }

    const accountAgeMs = Date.now() - user.createdAt.getTime();
    if (accountAgeMs < 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Tu cuenta debe tener al menos 24 horas de antigüedad para comentar' },
        { status: 403 }
      );
    }

    // 3. Buscar hilo y validar que esté activo
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true, status: true },
    });

    if (!thread || thread.status === 'deleted') {
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 });
    }

    if (thread.status === 'closed') {
      return NextResponse.json(
        { error: 'No se puede comentar en un hilo cerrado' },
        { status: 403 }
      );
    }

    // 4. Validar body con Zod
    const body = await req.json();
    const validation = createCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { content, quotedCommentId } = validation.data;

    // 5. Si hay cita, validar que el comentario exista y pertenezca al mismo hilo
    if (quotedCommentId) {
      const quoted = await prisma.comment.findUnique({
        where: { id: quotedCommentId },
        select: { threadId: true },
      });

      if (!quoted || quoted.threadId !== thread.id) {
        return NextResponse.json(
          { error: 'El comentario citado no existe o no pertenece a este hilo' },
          { status: 400 }
        );
      }
    }

    // 6. Crear comentario en DB
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: userId,
        threadId: thread.id,
        ...(quotedCommentId && { quotedCommentId }),
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: { id: true, username: true, avatar: true, role: true },
        },
        quotedComment: {
          select: {
            id: true,
            content: true,
            author: { select: { id: true, username: true } },
          },
        },
      },
    });

    // 7. Retornar 201 con el comentario creado
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error al crear comentario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { threadId } = await params;

    // 1. Verificar que el hilo exista y no esté eliminado
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true, status: true },
    });

    if (!thread || thread.status === 'deleted') {
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 });
    }

    // 2. Parsear query params
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
    const sort = searchParams.get('sort') ?? 'recent';

    // 3. Consultar comentarios del hilo con datos necesarios
    const comments = await prisma.comment.findMany({
      where: { threadId: thread.id },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, username: true, avatar: true, role: true },
        },
        votes: {
          select: { value: true },
        },
        quotedComment: {
          select: {
            id: true,
            content: true,
            author: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    // 4. Ordenar según sort param
    const sorted = comments.sort((a, b) => {
      if (sort === 'votes') {
        const votesA = a.votes.reduce((sum, v) => sum + v.value, 0);
        const votesB = b.votes.reduce((sum, v) => sum + v.value, 0);
        return votesB - votesA;
      }
      // default: recent (orden cronológico ascendente)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // 5. Paginar
    const total = sorted.length;
    const skip = (page - 1) * limit;
    const paginated = sorted.slice(skip, skip + limit);

    // 6. Mapear respuesta
    const result = paginated.map(({ votes, ...comment }) => ({
      ...comment,
      voteCount: votes.reduce((sum, v) => sum + v.value, 0),
    }));

    // 7. Retornar 200 con paginación
    return NextResponse.json(
      { comments: result, page, limit, total },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
