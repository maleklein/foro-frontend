// src/app/api/forums/[forumId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { extractUserIdFromToken } from '@/lib/auth/mock-token';
import { updateForumSchema } from '@/lib/validations';

type Params = { params: Promise<{ forumId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { forumId } = await params;

    // 1. Validar header Authorization y rol admin
    const userId = extractUserIdFromToken(req.headers.get('authorization'));

    if (!userId) {
      return NextResponse.json(
        { error: 'Token de autorización inválido o ausente' },
        { status: 401 }
      );
    }

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

    // 2. Verificar que el foro exista
    const existing = await prisma.forum.findUnique({
      where: { id: forumId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Foro no encontrado' }, { status: 404 });
    }

    // 3. Validar body con Zod
    const body = await req.json();
    const validation = updateForumSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 4. Actualizar los campos provistos
    const forum = await prisma.forum.update({
      where: { id: forumId },
      data: validation.data,
      select: {
        id: true,
        name: true,
        description: true,
        faculty: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 5. Retornar 200 con el foro actualizado
    return NextResponse.json(forum, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar foro:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
