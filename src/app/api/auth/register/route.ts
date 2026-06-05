// ============================================================
// ARCHIVO: src/app/api/auth/register/route.ts
// QUÉ ES: El endpoint de registro. Cuando el formulario del
// frontend hace submit, la request llega acá.
// ============================================================

// Next.js nos da estas dos clases para manejar requests y responses HTTP
// NextRequest = lo que llega (la request del frontend)
// NextResponse = lo que devolvemos (la respuesta JSON)
import { NextRequest, NextResponse } from 'next/server';

// Librería para hashear contraseñas. Nunca guardamos el password en texto plano.
import bcrypt from 'bcrypt';

// El schema de Zod que definimos en Mock 04 — describe qué forma
// tienen que tener los datos que llegan al endpoint
import { registerSchema } from '@/lib/validations';

// El cliente de Prisma — el objeto con el que hablamos con la base de datos
import { prisma } from '@/lib/db/prisma';

// Next.js sabe que esta función maneja requests de tipo POST
// porque se llama exactamente "POST" y está en un archivo route.ts
// La URL del endpoint es: POST /api/auth/register
export async function POST(req: NextRequest) {

  // try/catch envuelve todo el código del endpoint.
  // Si algo falla inesperadamente (por ejemplo, la DB no responde),
  // el catch lo atrapa y devuelve 500 en lugar de que el servidor explote.
  try {

    // ─────────────────────────────────────────────
    // PASO 1 — Leer y validar los datos que llegaron
    // ─────────────────────────────────────────────

    // req.json() lee el body de la request y lo convierte a un objeto JS.
    // En este punto, body es de tipo "any" — TypeScript no sabe nada de él.
    // Podría tener cualquier cosa o estar vacío.
    const body = await req.json();

    // safeParse() es el método de Zod para validar.
    // Revisa si body cumple TODAS las reglas del registerSchema:
    // que venga el email, que el password tenga mínimo 8 caracteres, etc.
    // NO lanza un error si falla — devuelve un objeto con el resultado.
    const validation = registerSchema.safeParse(body);

    // Si la validación falló (le faltaba un campo, el email no tenía @, etc.)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos de registro inválidos',
          // flatten().fieldErrors arma un objeto con los errores por campo.
          // Ejemplo: { email: ["email inválido"], password: ["mínimo 8 caracteres"] }
          // Así el frontend sabe exactamente qué campo está mal.
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 } // 400 = Bad Request — los datos que mandaron están mal
      );
    }

    // Si llegamos acá, la validación fue exitosa.
    // validation.data tiene todos los campos ya validados y tipados.
    // TypeScript sabe exactamente qué hay acá gracias al tipo derivado de Zod.
    // Si intentáramos acceder a un campo que no existe, TypeScript marcaría error.
    const { username, email, password, fullName, birthDate, sex, faculty, career, entryYear } =
      validation.data;
    // Esto es lo mismo que hacer:
    // const username = validation.data.username;
    // const email    = validation.data.email;

    // ─────────────────────────────────────────────
    // PASO 2 — Verificar que el email y username no estén ya en uso
    // ─────────────────────────────────────────────

    // findFirst busca el PRIMER usuario que cumpla la condición.
    // OR significa "que tenga este email O este username".
    // Si encuentra uno, significa que ya existe alguien con esos datos.
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    // Si encontró un usuario existente, hay conflicto
    if (existingUser) {
      // Averiguamos cuál de los dos campos está duplicado
      // comparando el email del usuario encontrado con el que llegó
      const conflictField = existingUser.email === email ? 'email' : 'username';
      return NextResponse.json(
        { error: `El ${conflictField} ya está registrado` },
        { status: 409 } // 409 = Conflict — ya existe un recurso con esos datos
      );
    }

    // ─────────────────────────────────────────────
    // PASO 3 — Hashear la contraseña
    // ─────────────────────────────────────────────

    // saltRounds = 10 significa que bcrypt aplica el algoritmo 2^10 = 1024 veces.
    // Cuanto más alto el número, más seguro pero más lento.
    // 10 es el estándar recomendado.
    const saltRounds = 10;

    // bcrypt.hash() convierte el password en texto plano a un hash irreversible.
    // Ejemplo: "miPassword123" → "$2b$10$xK9....(string largo imposible de revertir)"
    // NUNCA guardamos el password original, siempre el hash.
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ─────────────────────────────────────────────
    // PASO 4 — Simular CAPTCHA y email (MOCK)
    // ─────────────────────────────────────────────

    // En producción acá iría la verificación real con Google reCAPTCHA.
    // En el mock, simplemente lo logueamos en la consola del servidor.
    console.log(`[MOCK] CAPTCHA validado para ${email}`);

    // En producción acá iría el envío real del email de verificación.
    // En el mock, lo logueamos. El desarrollador puede ver el token en la consola
    // y usarlo manualmente para probar el endpoint de verify-email (Mock 06).
    console.log(`[MOCK] Email de verificación enviado a ${email}`);

    // ─────────────────────────────────────────────
    // PASO 5 — Guardar el usuario en la base de datos
    // ─────────────────────────────────────────────

    // prisma.user.create() inserta un nuevo registro en la tabla User.
    const newUser = await prisma.user.create({

      // "data" son los campos que vamos a guardar en la DB
      data: {
        username,
        email,
        passwordHash,     // guardamos el hash, NUNCA el password original
        fullName,
        birthDate: new Date(birthDate), // convertimos el string a objeto Date
        sex,
        faculty,
        career,
        entryYear,
        emailVerified: false, // el usuario aún no verificó su email
                              // no puede publicar hasta que lo verifique (RN-002)
        role: 'user',         // todos los nuevos usuarios arrancan con rol básico
      },

      // "select" define QUÉ campos queremos que Prisma nos devuelva.
      // Lo que NO está acá NO se incluye en la respuesta.
      // Específicamente, passwordHash NO está en la lista —
      // nunca devolvemos el hash al frontend, aunque esté en la DB.
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        birthDate: true, //Es para controlar qué campos de la base de datos se devuelven en la respuesta.
                          //Sin el select, Prisma devolvería todos los campos del usuario, incluyendo passwordHash. Con el select en true solo los campos listados, y passwordHash no está — así nunca se expone al cliente.
        sex: true,
        faculty: true,
        career: true,
        entryYear: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        // passwordHash: NO está acá — intencionalmente excluido
      },
    });

    // ─────────────────────────────────────────────
    // PASO 6 — Devolver la respuesta al frontend
    // ─────────────────────────────────────────────

    // 201 = Created — se creó un nuevo recurso exitosamente
    // newUser contiene solo los campos del select de arriba (sin passwordHash)
    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    // Si algo falló inesperadamente (error de DB, error de red, etc.)
    // lo logueamos en la consola del servidor para poder debuggearlo
    console.error('Error en registro:', error);

    // Y devolvemos 500 al frontend — error interno del servidor
    // No devolvemos el detalle del error por seguridad
    // (no queremos exponer información interna de la infraestructura)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}