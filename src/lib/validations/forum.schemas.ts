// src/lib/validations/forum.schemas.ts
import { z } from 'zod';

export const createThreadSchema = z.object({
  title: z
    .string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(150, 'El título no puede exceder 150 caracteres'),

  content: z
    .string()
    .min(10, 'El contenido debe tener al menos 10 caracteres')
    .max(50000, 'El contenido es demasiado extenso'),

  tags: z
    .array(z.string().max(30, 'Cada tag no puede exceder 30 caracteres'))
    .max(5, 'Máximo 5 tags por hilo')
    .default([]),

  subforumId: z.string().cuid('ID de subforo inválido'),
});

export const updateThreadSchema = z.object({
  title: z
    .string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(150)
    .optional(),
  content: z.string().min(10).max(50000).optional(),
  tags: z
    .array(z.string().max(30, 'Cada tag no puede exceder 30 caracteres'))
    .max(5, 'Máximo 5 tags por hilo')
    .optional(),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'El comentario no puede estar vacío')
    .max(10000, 'El comentario es demasiado extenso'),

  quotedCommentId: z.string().cuid('ID de comentario citado inválido').optional(),
});

export const createReportSchema = z.object({
  targetId: z.string().cuid('ID inválido'),
  targetType: z.enum(['Thread', 'Comment', 'RepositoryFile', 'User'], {
    message: 'Tipo de objetivo inválido',
  }),
  reason: z.string().min(3, 'Debe seleccionar un motivo').max(50),
  details: z.string().max(500, 'Los detalles no pueden exceder 500 caracteres').optional(),
});

export const voteSchema = z.object({
  targetId: z.string().cuid('ID inválido'),
  targetType: z.enum(['Thread', 'Comment', 'RepositoryFile']),
  value: z.number().refine((v) => v === 1 || v === -1, 'El voto debe ser +1 o -1'),
});

export const moveThreadSchema = z.object({
  targetSubforumId: z.string().cuid('ID de subforo destino inválido'),
  reason: z.string().min(5, 'Debe especificar un motivo').max(200).optional(),
});

export const toggleThreadStatusSchema = z.object({
  reason: z.string().min(5, 'Debe especificar un motivo').max(200).optional(),
});

export const deleteThreadSchema = z.object({
  reason: z.string().min(5, 'Debe especificar el motivo de eliminación').max(200),
});

export const createForumSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
  faculty: z.string().max(50).optional(),
});

export const updateForumSchema = createForumSchema.partial();

export type CreateForumInput = z.infer<typeof createForumSchema>;
export type UpdateForumInput = z.infer<typeof updateForumSchema>;
export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type UpdateThreadInput = z.infer<typeof updateThreadSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type MoveThreadInput = z.infer<typeof moveThreadSchema>;
export type ToggleThreadStatusInput = z.infer<typeof toggleThreadStatusSchema>;
export type DeleteThreadInput = z.infer<typeof deleteThreadSchema>;