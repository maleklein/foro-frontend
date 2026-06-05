// src/app/api/threads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { extractUserIdFromToken } from '@/lib/auth/mock-token';
import { createThreadSchema } from '@/lib/validations';

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

export async function POST(req: NextRequest) {
  try {
    // 1. Validar header Authorization y extraer userId
    const userId = extractUserIdFromToken(req.headers.get('authorization'));

    if (!userId) {
      return NextResponse.json(
        { error: 'Token de autorización inválido o ausente' },
        { status: 401 }
      );
    }

    // 2. Verificar usuario autenticado y emailVerified
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, emailVerified: true, createdAt: true },
    });

    if (!user || !user.emailVerified) {
      return NextResponse.json(
        { error: 'Debes verificar tu email para publicar hilos' },
        { status: 403 }
      );
    }

    // 3. Validar antigüedad mínima de 24h desde creación de cuenta (RN-002)
    const accountAgeMs = Date.now() - user.createdAt.getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    if (accountAgeMs < twentyFourHoursMs) {
      return NextResponse.json(
        { error: 'Tu cuenta debe tener al menos 24 horas de antigüedad para publicar hilos' },
        { status: 403 }
      );
    }

    // 4. Validar body con Zod
    const body = await req.json();
    const validation = createThreadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { title, content, tags, subforumId } = validation.data;

    // Verificar que el subforo exista
    const subforum = await prisma.subforum.findUnique({ where: { id: subforumId } });

    if (!subforum) {
      return NextResponse.json({ error: 'Subforo no encontrado' }, { status: 404 });
    }

    // 5. Generar slug único en el subforo
    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let suffix = 2;

    while (await prisma.thread.findUnique({ where: { subforumId_slug: { subforumId, slug } } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    // 6. Crear hilo en DB con estado "active"
    const thread = await prisma.thread.create({
      data: {
        title,
        content,
        slug,
        tags: tags ?? [],
        subforumId,
        authorId: userId,
        status: 'active',
      },
      select: {
        id: true,
        title: true,
        content: true,
        slug: true,
        status: true,
        pinned: true,
        createdAt: true,
        author: {
          select: { id: true, username: true, avatar: true },
        },
        subforum: {
          select: {
            id: true,
            name: true,
            forum: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 7. Retornar 201 con el hilo creado
    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error('Error al crear hilo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
