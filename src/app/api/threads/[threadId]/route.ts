// src/app/api/threads/[threadId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { extractUserIdFromToken } from '@/lib/auth/mock-token';
import { updateThreadSchema } from '@/lib/validations';

function generateSlug(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

type Params = { params: Promise<{ threadId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
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

    // 2. Buscar hilo por id
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        title: true,
        slug: true,
        subforumId: true,
        authorId: true,
        status: true,
      },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 });
    }

    // 3. Verificar autoría
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (thread.authorId !== userId) {
      return NextResponse.json(
        { error: 'Solo el autor puede editar este hilo' },
        { status: 403 }
      );
    }

    // 4. Validar que el hilo no esté cerrado ni eliminado
    if (thread.status === 'closed' || thread.status === 'deleted') {
      return NextResponse.json(
        { error: 'No se puede editar un hilo cerrado o eliminado' },
        { status: 403 }
      );
    }

    // 5. Validar body con Zod
    const body = await req.json();
    const validation = updateThreadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { title, content } = validation.data;

    // 6. Si cambia el título, regenerar slug único
    let newSlug = thread.slug;
    const slugChanged = title !== undefined && title !== thread.title;

    if (slugChanged) {
      const baseSlug = generateSlug(title!);
      newSlug = baseSlug;
      let suffix = 2;

      while (
        await prisma.thread.findFirst({
          where: {
            subforumId: thread.subforumId,
            slug: newSlug,
            NOT: { id: thread.id },
          },
        })
      ) {
        newSlug = `${baseSlug}-${suffix++}`;
      }
    }

    // 7. Actualizar hilo (updatedAt se registra automáticamente)
    if (user && (user.role === 'moderator' || user.role === 'admin')) {
      console.log(`[MOCK] editedBy registrado: ${userId}`);
    }

    const updated = await prisma.thread.update({
      where: { id: thread.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(slugChanged && { slug: newSlug }),
      },
      select: {
        id: true,
        title: true,
        content: true,
        slug: true,
        status: true,
        pinned: true,
        updatedAt: true,
      },
    });

    // 8. Retornar 200 con hilo actualizado + info de redirección si cambió el slug
    return NextResponse.json(
      {
        ...updated,
        ...(slugChanged && {
          redirect: { status: 301, previousSlug: thread.slug, newSlug },
        }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al actualizar hilo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { threadId } = await params;

    // 1. Buscar hilo por id o slug
    const thread = await prisma.thread.findFirst({
      where: {
        OR: [{ id: threadId }, { slug: threadId }],
      },
      select: {
        id: true,
        title: true,
        content: true,
        slug: true,
        status: true,
        pinned: true,
        tags: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true,
            emailVerified: true,
          },
        },
        votes: {
          select: { value: true },
        },
        _count: {
          select: { comments: true },
        },
        subforum: {
          select: {
            id: true,
            name: true,
            forum: {
              select: { id: true, name: true, faculty: true },
            },
          },
        },
      },
    });

    // 2. Si no existe o está eliminado → 404
    if (!thread || thread.status === 'deleted') {
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 });
    }

    // 3. Incrementar contador de vistas (mock: sin await para no bloquear respuesta)
    prisma.thread.update({
      where: { id: thread.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    // 4. Calcular votos
    const voteCount = thread.votes.reduce((sum, v) => sum + v.value, 0);

    // 5. Retornar 200 con el hilo completo
    const { votes, _count, ...threadData } = thread;

    return NextResponse.json(
      {
        ...threadData,
        stats: {
          votes: voteCount,
          views: thread.viewCount,
          comments: _count.comments,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error al obtener hilo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
