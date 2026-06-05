// ─────────────────────────────────────────────────────────────
// ARCHIVO: src/lib/auth/mock-token.ts
//
// QUÉ ES: Una utilidad de autenticación del BFF Mock.
// Contiene la lógica para leer y validar el token de sesión
// mockeado que usan los endpoints protegidos.
//
// POR QUÉ EXISTE COMO ARCHIVO SEPARADO:
// Patrón DRY — varios endpoints necesitan saber quién es el
// usuario autenticado. 
// En lugar de copiar esta lógica en cada route.ts, se centraliza acá y
// se importa donde se necesite.
// ─────────────────────────────────────────────────────────────

// El token mock tiene el formato: mock-session-{userId}-{timestamp}
// Ejemplo real: mock-session-clxyz123abc-1714000000000
//
// Este formato lo genera el endpoint de login cuando el usuario se autentica correctamente.
// Luego el frontend lo guarda (en localStorage) y lo manda en cada request
// que requiere autenticación, dentro del header Authorization.
//
// Ejemplo del header que manda el frontend:
// Authorization: Bearer mock-session-clxyz123abc-1714000000000

export function extractUserIdFromToken(authHeader: string | null): string | null {

  // Si no hay header Authorization, o no empieza con "Bearer ",
  // no hay token válido → retornamos null.
  // El ?. es "optional chaining": si authHeader es null,
  // no falla — simplemente evalúa a false.
  if (!authHeader?.startsWith('Bearer ')) return null;

  // El header tiene el formato: "Bearer mock-session-clxyz123-1714000000000"
  // slice(7) corta los primeros 7 caracteres ("Bearer ")
  // y nos deja solo el token: "mock-session-clxyz123-1714000000000"
  const token = authHeader.slice(7);

  // Usamos una expresión regular (regex) para validar el formato
  // y extraer el userId al mismo tiempo.
  //
  // La regex: /^mock-session-(.+)-\d+$/
  //   ^            → el string tiene que empezar acá
  //   mock-session- → tiene que tener este texto literal
  //   (.+)         → captura el userId (cualquier cosa, uno o más caracteres)
  //   -            → guión separador
  //   \d+          → el timestamp (solo dígitos, uno o más)
  //   $            → el string tiene que terminar acá
  //
  // match() retorna un array si encuentra coincidencia, o null si no.
  // Ejemplo: "mock-session-clxyz123-1714000000000".match(regex)
  // → ["mock-session-clxyz123-1714000000000", "clxyz123"]
  //     match[0] = el string completo
  //     match[1] = lo que capturó el (.+) = el userId
  const match = token.match(/^mock-session-(.+)-\d+$/);

  // Si match es null → el token no tiene el formato correcto → null
  // Si match existe → retornamos match[1] que es el userId extraído
  return match ? match[1] : null;
}

// ─────────────────────────────────────────────────────────────
// CÓMO SE USA EN LOS ENDPOINTS:
//
// import { extractUserIdFromToken } from '@/lib/auth/mock-token';
//
// export async function GET(req: NextRequest) {
//   const userId = extractUserIdFromToken(req.headers.get('Authorization'));
//
//   if (!userId) {
//     return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
//   }
//
//   // A partir de acá sabemos quién es el usuario
//   const user = await prisma.user.findUnique({ where: { id: userId } });
// }
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// POR QUÉ ES UN MOCK:
// En producción (Fase 2) esto se reemplaza por verificación
// JWT real: el token estaría firmado criptográficamente con una
// clave secreta y tendría fecha de expiración. Nadie podría
// falsificarlo sin conocer la clave.
//
// ─────────────────────────────────────────────────────────────