import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { tracking_uuid: uuid },
      select: { latitud_actual: true, longitud_actual: true, estado: true }
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(pedido);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
