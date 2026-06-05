// src/app/api/auth/recover-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { recoverPasswordSchema } from '@/lib/validations';
import { prisma } from '@/lib/db/prisma';

const NEUTRAL_MESSAGE = 'Si el email existe en nuestra base, te enviamos un enlace de recuperación';

export async function POST(req: NextRequest) { //Cuando el usuario hace clic en "Recuperar contraseña" en el frontend, se envía una request POST a /api/auth/recover-password, y esta función es la que la recibe y procesa.
  try {
    // 1. Validar body con Zod
    const body = await req.json(); 
    const validation = recoverPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // 2. Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // 3. Si existe, mockear generación de token de recovery
    if (user) {
      const recoveryToken = `mock-recovery-${user.id}-${Date.now()}`;
      console.log(`[MOCK] Token de recuperación generado para ${email}: ${recoveryToken}`);
      console.log(`[MOCK] Email de recuperación enviado a ${email}`);
    }

    // 4. Siempre retornar 200 con mensaje neutro (no revelar si el email existe)
    return NextResponse.json({ message: NEUTRAL_MESSAGE }, { status: 200 });
  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
