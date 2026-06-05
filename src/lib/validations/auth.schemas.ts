// src/lib/validations/auth.schemas.ts

// Importamos Zod — la librería que nos permite definir schemas de validación
import { z } from 'zod';

// ─────────────────────────────────────────────
// SCHEMA DE REGISTRO
// Zod describe la forma y las reglas que tienen que cumplir
// los datos que lleguen al endpoint de registro.
// ─────────────────────────────────────────────
export const registerSchema = z.object({

  // username tiene que ser string, mínimo 3 caracteres, máximo 20,
  // y solo puede tener letras, números y guiones bajos.
  // El segundo argumento de cada método es el mensaje de error
  // que Zod devuelve si no se cumple esa regla.
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(20, 'El nombre de usuario no puede exceder 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos'),

  email: z
    .string()
    .email('Correo electrónico inválido') // verifica que tenga formato email válido (@, dominio, etc.)
    .max(100, 'El correo no puede exceder 100 caracteres'),

  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña es demasiado larga')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')  // /[A-Z]/ = regex que busca una mayúscula
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),

  fullName: z
    .string()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .max(100, 'El nombre completo no puede exceder 100 caracteres'),

  birthDate: z
    .string()
    // refine() permite agregar validaciones personalizadas que Zod no tiene por defecto.
    // Date.parse(date) intenta convertir el string a una fecha — si da NaN, la fecha es inválida.
    .refine((date) => !isNaN(Date.parse(date)), 'Fecha de nacimiento inválida')
    // transform() convierte el dato de un tipo a otro DESPUÉS de validarlo.
    // Acá convierte el string "1999-04-15" a un objeto Date de JavaScript.
    .transform((date) => new Date(date))
    // Segundo refine DESPUÉS del transform — ahora date ya es un objeto Date.
    // Calcula la edad y verifica que sea mayor de 16 años.
    .refine((date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 16;
    }, 'Debes tener al menos 16 años'),

  // enum() restringe el valor a una lista fija de opciones.
  // Solo acepta exactamente "M", "F" u "Otro". Cualquier otra cosa → error.
  sex: z.enum(['M', 'F', 'Otro'], {
    message: 'Sexo debe ser M, F u Otro',
  }),

  faculty: z
    .string()
    .min(1, 'La facultad es requerida')
    .max(50, 'Nombre de facultad demasiado largo'),

  career: z
    .string()
    .min(1, 'La carrera es requerida')
    .max(100, 'Nombre de carrera demasiado largo'),

  // number() valida que sea un número (no un string).
  // int() valida que sea entero (no decimal).
  entryYear: z
    .number({ message: 'Año de ingreso debe ser un número' })
    .int('Año de ingreso debe ser entero')
    .min(1990, 'Año de ingreso no puede ser anterior a 1990')
    .max(new Date().getFullYear(), 'Año de ingreso no puede ser futuro'),

  // optional() significa que este campo puede NO venir en el body
  // y Zod no va a marcar error. En el mock el CAPTCHA es simulado,
  // pero el campo existe para cuando se implemente el real.
  captchaToken: z.string().optional(),
});

// Schema de login — mucho más simple, solo email y password
export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Schema de recuperación de contraseña — solo necesita el email
export const recoverPasswordSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
});

// Schema de reset de contraseña — tiene una validación cruzada entre campos
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token requerido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
  })
  // Este refine está fuera del z.object() — se aplica al objeto completo.
  // Verifica que password y confirmPassword sean iguales.
  // Esto no se puede hacer con validaciones individuales de campo,
  // porque necesitás comparar DOS campos entre sí.
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'], // le dice a Zod en qué campo poner el error
  });

// Schema para verificar email — valida que el token tenga el formato mock esperado
export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, 'Token requerido')
    // Solo acepta tokens que empiecen con "mock-token-" seguido de cualquier cosa
    .regex(/^mock-token-.+$/, 'Formato de token inválido'),
});


// ─────────────────────────────────────────────
// ACÁ APARECEN LOS TIPOS DE TYPESCRIPT
// ─────────────────────────────────────────────

// z.infer<typeof registerSchema> le dice a TypeScript:
// "mirá el schema de arriba y generá el tipo automáticamente"
// El resultado es exactamente igual a haber escrito a mano:
// type RegisterInput = {
//   username: string;
//   email: string;
//   password: string;
//   fullName: string;
//   birthDate: Date;      ← Date porque el transform lo convirtió
//   sex: "M" | "F" | "Otro";
//   faculty: string;
//   career: string;
//   entryYear: number;
//   captchaToken?: string;  ← opcional porque tiene .optional()
// }
// Pero no lo escribi a mano — Zod lo derivó del schema.
export type RegisterInput = z.infer<typeof registerSchema>;

// Lo mismo para cada schema — cada uno genera su propio tipo TypeScript
export type LoginInput = z.infer<typeof loginSchema>;
// LoginInput equivale a: { email: string; password: string }

export type RecoverPasswordInput = z.infer<typeof recoverPasswordSchema>;
// RecoverPasswordInput equivale a: { email: string }

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
// ResetPasswordInput equivale a: { token: string; password: string; confirmPassword: string }

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
// VerifyEmailInput equivale a: { token: string }