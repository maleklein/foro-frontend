import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

type Params = { params: Promise<{ subforumId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { subforumId } = await params;

    const subforum = await prisma.subforum.findUnique({
      where: { id: subforumId },
      select: {
        id: true,
        name: true,
        description: true,
        tags: true,
        forum: {
          select: { id: true, name: true, faculty: true },
        },
      },
    });

    if (!subforum) {
      return NextResponse.json({ error: 'Subforo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(
      {
        ...subforum,
        tags: Array.isArray(subforum.tags) ? subforum.tags : [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al obtener subforo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
