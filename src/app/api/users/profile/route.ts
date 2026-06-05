// src/app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateProfileSchema } from '@/lib/validations';
import { prisma } from '@/lib/db/prisma';
import { extractUserIdFromToken } from '@/lib/auth/mock-token';

// Campos que el usuario NO puede editar directamente
const IMMUTABLE_FIELDS = [
  'fullName',
  'email',
  'passwordHash',
  'birthDate',
  'sex',
  'faculty',
  'career',
  'entryYear',
  'role',
  'emailVerified',
  'emailVerifiedAt',
  'verificationStatus',
];

export async function PUT(req: NextRequest) {
  try {
    // 1. Validar header Authorization
    const userId = extractUserIdFromToken(req.headers.get('authorization'));

    if (!userId) {
      return NextResponse.json(
        { error: 'Token de autorización inválido o ausente' },
        { status: 401 }
      );
    }

    // 2. Verificar que el usuario autenticado existe
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 3. Parsear body y detectar campos inmutables antes de validar
    const body = await req.json();

    const attemptedImmutable = IMMUTABLE_FIELDS.filter((field) => field in body);
    if (attemptedImmutable.length > 0) {
      return NextResponse.json(
        {
          error: 'Campos no editables',
          fields: attemptedImmutable,
        },
        { status: 400 }
      );
    }

    // 4. Validar body con Zod
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { username, avatar, bio } = validation.data;

    // 5. Si viene username, verificar que no esté tomado por otro usuario
    if (username && username !== currentUser.username) {
      const taken = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (taken) {
        return NextResponse.json(
          { error: 'El nombre de usuario ya está en uso' },
          { status: 409 }
        );
      }
    }

    // 6. Actualizar solo los campos permitidos que llegaron en el body
    const updateData: Record<string, string> = {};
    if (username !== undefined) updateData.username = username;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        emailVerified: true,
        faculty: true,
        career: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 7. Retornar 200 con perfil actualizado
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
