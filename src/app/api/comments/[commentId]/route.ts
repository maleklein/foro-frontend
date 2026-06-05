// src/app/api/comments/[commentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { extractUserIdFromToken } from '@/lib/auth/mock-token';
import { z } from 'zod';

const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'El comentario no puede estar vacío')
    .max(10000, 'El comentario es demasiado extenso'),
});

type Params = { params: Promise<{ commentId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { commentId } = await params;

    // 1. Validar header Authorization y extraer userId
    const userId = extractUserIdFromToken(req.headers.get('authorization'));

    if (!userId) {
      return NextResponse.json(
        { error: 'Token de autorización inválido o ausente' },
        { status: 401 }
      );
    }

    // 2. Buscar comentario por id
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    // 3. Verificar autoría
    if (comment.authorId !== userId) {
      return NextResponse.json(
        { error: 'Solo el autor puede editar este comentario' },
        { status: 403 }
      );
    }

    // 4. Validar body con Zod
    const body = await req.json();
    const validation = updateCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 5. Actualizar contenido (updatedAt se registra automáticamente como editedAt)
    const updated = await prisma.comment.update({
      where: { id: comment.id },
      data: { content: validation.data.content },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, username: true, avatar: true },
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

    // 6. Retornar 200 con el comentario actualizado
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar comentario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { commentId } = await params;

    // 1. Validar header Authorization y extraer userId
    const userId = extractUserIdFromToken(_req.headers.get('authorization'));

    if (!userId) {
      return NextResponse.json(
        { error: 'Token de autorización inválido o ausente' },
        { status: 401 }
      );
    }

    // 2. Buscar comentario por id
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, content: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    // 3. Validar autoría o rol (autor, moderador o admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAuthor = comment.authorId === userId;
    const isModOrAdmin = user?.role === 'moderator' || user?.role === 'admin';

    if (!isAuthor && !isModOrAdmin) {
      return NextResponse.json(
        { error: 'No tenés permiso para eliminar este comentario' },
        { status: 403 }
      );
    }

    // 4. Soft delete: reemplazar contenido con placeholder y registrar quién eliminó
    // El schema no tiene deletedAt/deletedBy, se usa updatedAt como timestamp y se loguea el actor
    console.log(`[MOCK] Comentario ${commentId} eliminado por userId: ${userId}`);

    await prisma.comment.update({
      where: { id: comment.id },
      data: { content: '[comentario eliminado]' },
    });

    // 5. El comentario se preserva en DB para no romper citas de otros comentarios

    // 6. Retornar 200 con confirmación
    return NextResponse.json(
      { message: 'Comentario eliminado correctamente', id: comment.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
