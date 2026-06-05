// src/app/api/forums/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { extractUserIdFromToken } from '@/lib/auth/mock-token';
import { createForumSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    // 1. Validar header Authorization
    const userId = extractUserIdFromToken(req.headers.get('authorization'));

    if (!userId) {
      return NextResponse.json(
        { error: 'Token de autorización inválido o ausente' },
        { status: 401 }
      );
    }

    // 2. Verificar que el usuario exista y tenga rol admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado: se requiere rol de administrador' },
        { status: 403 }
      );
    }

    // 3. Validar body con Zod
    const body = await req.json();
    const validation = createForumSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, description, faculty } = validation.data;

    // 4. Verificar que no exista un foro con el mismo nombre
    const existing = await prisma.forum.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un foro con ese nombre' },
        { status: 409 }
      );
    }

    // 5. Crear foro en DB
    const forum = await prisma.forum.create({
      data: { name, description, faculty },
      select: {
        id: true,
        name: true,
        description: true,
        faculty: true,
        order: true,
        createdAt: true,
      },
    });

    // 6. Retornar 201 con el foro creado
    return NextResponse.json(forum, { status: 201 });
  } catch (error) {
    console.error('Error al crear foro:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 1. Consultar todos los foros con sus subforos y métricas por subforo
    const forums = await prisma.forum.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        faculty: true,
        subforums: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: { select: { threads: true } },
            threads: {
              select: {
                createdAt: true,
                _count: { select: { comments: true } },
                comments: {
                  select: { createdAt: true },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // 2. Calcular métricas por subforo y mapear cada foro
    const mapped = forums.map((forum) => ({
      id: forum.id,
      name: forum.name,
      description: forum.description,
      faculty: forum.faculty,
      subforums: forum.subforums.map((subforum) => {
        const threadCount = subforum._count.threads;
        let totalMessages = threadCount;
        let lastMovement: Date | null = null;

        for (const thread of subforum.threads) {
          totalMessages += thread._count.comments;

          if (!lastMovement || thread.createdAt > lastMovement) {
            lastMovement = thread.createdAt;
          }
          const latestComment = thread.comments[0];
          if (latestComment && (!lastMovement || latestComment.createdAt > lastMovement)) {
            lastMovement = latestComment.createdAt;
          }
        }

        return {
          id: subforum.id,
          name: subforum.name,
          description: subforum.description,
          threadCount,
          totalMessages,
          lastMovement,
        };
      }),
    }));

    // 3. Agrupar por facultad (null → 'General')
    const groupedMap = new Map<string, typeof mapped>();

    for (const forum of mapped) {
      const key = forum.faculty ?? 'General';
      if (!groupedMap.has(key)) groupedMap.set(key, []);
      groupedMap.get(key)!.push(forum);
    }

    const result = Array.from(groupedMap.entries()).map(([faculty, forums]) => ({
      faculty,
      forums,
    }));

    // 4. Retornar 200 con estructura [{ faculty, forums: [{ ..., subforums: [...] }] }]
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error al obtener foros:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
