// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { loginSchema } from '@/lib/validations';
import { prisma } from '@/lib/db/prisma';

//Este endpoint maneja el inicio de sesion. 
//Recibe un email y contraseña, los valida, los verifica contra la base de datos, y si todo está bien devuelve los datos del usuario y un token de sesión.

export async function POST(req: NextRequest) { //hacemos una ruta post del login
  try {
    // 1. Validar body con Zod
    const body = await req.json(); //obtenemos los datos del body en json y los convertimos en un objeto js
    const validation = loginSchema.safeParse(body); //verificamos el cuerpo con Zod

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.flatten().fieldErrors, //si los datos son invalidos (segun Zod) lanza error
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data; //obtenemos el email y contrasena del usuario 

    // 2. Buscar usuario por email en la base de datos
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 3. Verificar existencia y contraseña (mensaje genérico para no revelar cuál falló)
    const passwordMatch = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !passwordMatch) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // 4. Verificar si el email fue verificado
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Debes verificar tu email antes de iniciar sesión' },
        { status: 403 }
      );
    }

    // 5. Mockear generación de token de sesión
    const token = `mock-session-${user.id}-${Date.now()}`;
    console.log(`[MOCK] Sesión generada para ${email}: ${token}`);

    // 6. Retornar 200 con usuario (sin passwordHash) y token
    return NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          emailVerified: user.emailVerified,
          faculty: user.faculty,
          career: user.career,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
