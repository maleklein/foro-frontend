// src/lib/validations/user.schemas.ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos')
    .optional(),

  avatar: z
    .string()
    .url('URL de avatar inválida')
    .max(500, 'URL demasiado larga')
    .optional(),

  bio: z
    .string()
    .max(500, 'La biografía no puede exceder 500 caracteres')
    .optional(),
});

export const changeEmailSchema = z.object({
  newEmail: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña actual es requerida'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Las nuevas contraseñas no coinciden',
    path: ['confirmNewPassword'],
  });

export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  filterSensitiveWords: z.boolean().optional(),
  showBirthDate: z.enum(['hidden', 'dayMonth', 'full']).optional(),
  showEmail: z.boolean().optional(),
});

export const updateNotificationSettingsSchema = z.object({
  threadReply: z.object({ inApp: z.boolean(), email: z.boolean() }).optional(),
  commentQuote: z.object({ inApp: z.boolean(), email: z.boolean() }).optional(),
  fileComment: z.object({ inApp: z.boolean(), email: z.boolean() }).optional(),
  verificationUpdate: z.object({ inApp: z.boolean(), email: z.boolean() }).optional(),
  accountSuspended: z.object({ inApp: z.boolean(), email: z.boolean() }).optional(),
  threadClosed: z.object({ inApp: z.boolean(), email: z.boolean() }).optional(),
  newThreadInSubforum: z.object({ inApp: z.boolean(), email: z.boolean() }).optional(),
});

export const requestVerificationSchema = z.object({
  type: z.enum(['api', 'pdf'], {
    message: 'Tipo de verificación debe ser api o pdf',
  }),
  documentPath: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>;
export type RequestVerificationInput = z.infer<typeof requestVerificationSchema>;