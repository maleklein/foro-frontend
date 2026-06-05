// src/app/api/users/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { extractUserIdFromToken } from '@/lib/auth/mock-token';

export async function GET(req: NextRequest) {
  try {
    // 1. Validar header Authorization
    const userId = extractUserIdFromToken(req.headers.get('authorization'));

    if (!userId) {
      return NextResponse.json(
        { error: 'Token de autorización inválido o ausente' },
        { status: 401 }
      );
    }

    // 2. Buscar usuario por id con todos los campos (privados incluidos)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        birthDate: true,
        sex: true,
        faculty: true,
        career: true,
        entryYear: true,
        bio: true,
        avatar: true,
        role: true,
        emailVerified: true,
        emailVerifiedAt: true,
        verificationStatus: true,
        verificationType: true,
        createdAt: true,
        updatedAt: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 3. Retornar 200 con perfil completo
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error al obtener usuario autenticado:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
