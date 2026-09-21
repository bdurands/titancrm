import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const VERIFY_TOKEN = 'titan_crm_secure_token_123'; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("=== WEBHOOK RECIBIDO ===");
    console.log(JSON.stringify(body, null, 2));

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (messages && messages.length > 0) {
        const msg = messages[0];
        const from = msg.from; 
        const text = msg.text?.body || '';
        const name = value?.contacts?.[0]?.profile?.name || 'Prospecto WhatsApp';

        if (text) {
          let conversacion = await prisma.conversacion.findFirst({
            where: { contacto_id: from, origen: 'whatsapp' }
          });

          if (!conversacion) {
            conversacion = await prisma.conversacion.create({
              data: {
                origen: 'whatsapp',
                contacto_id: from,
                nombre_prospecto: name,
                estado: 'Nuevos'
              }
            });
          } else {
            await prisma.conversacion.update({
              where: { id: conversacion.id },
              data: { ultima_actividad: new Date() }
            });
          }

          await prisma.mensaje.create({
            data: {
              conversacion_id: conversacion.id,
              cuerpo: text,
              es_entrante: true
            }
          });
        }
      }
    } else if (body.object === 'page') {
      // Messenger Logic
      const entry = body.entry?.[0];
      const messaging = entry?.messaging?.[0];
      if (messaging && messaging.message && !messaging.message.is_echo) {
        const senderId = messaging.sender.id;
        const text = messaging.message.text;

        if (text) {
          let conversacion = await prisma.conversacion.findFirst({
            where: { contacto_id: senderId, origen: 'facebook' }
          });

          if (!conversacion) {
            conversacion = await prisma.conversacion.create({
              data: {
                origen: 'facebook',
                contacto_id: senderId,
                nombre_prospecto: 'Usuario Facebook',
                estado: 'Nuevos'
              }
            });
          } else {
            await prisma.conversacion.update({
              where: { id: conversacion.id },
              data: { ultima_actividad: new Date() }
            });
          }

          await prisma.mensaje.create({
            data: {
              conversacion_id: conversacion.id,
              cuerpo: text,
              es_entrante: true
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse('Error interno', { status: 500 });
  }
}
