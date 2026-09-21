'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getConversaciones() {
  try {
    return await prisma.conversacion.findMany({
      include: {
        mensajes: { orderBy: { fecha: 'asc' } }
      },
      orderBy: { ultima_actividad: 'desc' }
    });
  } catch (error) {
    console.error("Error fetching conversaciones:", error);
    return [];
  }
}

export async function createConversacionManual(formData: FormData) {
  const origen = formData.get('origen') as string;
  const contacto_id = formData.get('contacto_id') as string;
  const nombre_prospecto = formData.get('nombre_prospecto') as string;

  if (!origen || !contacto_id || !nombre_prospecto) return { error: 'Faltan datos.' };

  try {
    await prisma.conversacion.create({
      data: { origen, contacto_id, nombre_prospecto, estado: 'Nuevos' }
    });
    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (e) {
    return { error: 'Error al crear lead.' };
  }
}

export async function updateEstadoLead(id: string, estado: string) {
  try {
    await prisma.conversacion.update({ where: { id }, data: { estado } });
    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (e) {
    return { error: 'Error al actualizar.' };
  }
}

export async function sendMensajeToLead(conversacion_id: string, texto: string) {
  try {
    const conv = await prisma.conversacion.findUnique({ where: { id: conversacion_id } });
    if (!conv) return { error: 'Conversación no encontrada.' };

    // Intentar enviar el mensaje real si es WhatsApp
    if (conv.origen === 'whatsapp') {
      const token   = process.env.WHATSAPP_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_ID;

      if (token && phoneId) {
        const formattedPhone = conv.contacto_id.startsWith('51')
          ? conv.contacto_id
          : `51${conv.contacto_id}`;

        const res = await fetch(
          `https://graph.facebook.com/v19.0/${phoneId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: formattedPhone,
              type: 'text',
              text: { body: texto },
            }),
          }
        );

        if (!res.ok) {
          const err = await res.json();
          console.error('WhatsApp send error:', err);
          return { error: err?.error?.message || 'Error al enviar por WhatsApp.' };
        }
      }
    }

    // Guardar el mensaje en la base de datos
    await prisma.mensaje.create({
      data: {
        conversacion_id,
        cuerpo: texto,
        es_entrante: false,
      },
    });

    await prisma.conversacion.update({
      where: { id: conversacion_id },
      data: { ultima_actividad: new Date() },
    });

    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (e: any) {
    console.error('sendMensajeToLead error:', e);
    return { error: 'Error al enviar.' };
  }
}

export async function convertToClient(formData: FormData) {
  const conversacion_id = formData.get('conversacion_id') as string;
  
  try {
    const conv = await prisma.conversacion.findUnique({ where: { id: conversacion_id } });
    if (!conv) return { error: 'Lead no existe.' };
    
    await prisma.cliente.create({
      data: {
        nombres: conv.nombre_prospecto,
        celular: conv.contacto_id,
        origen: conv.origen === 'whatsapp' ? 'WhatsApp' : 'Facebook',
        estado: 'Cliente Activo'
      }
    });

    await prisma.conversacion.update({
      where: { id: conversacion_id },
      data: { estado: 'Convertidos' }
    });

    revalidatePath('/dashboard/leads');
    revalidatePath('/dashboard/clientes');
    return { success: true };
  } catch (e) {
    return { error: 'Error al convertir a cliente.' };
  }
}

export async function updateNombreLead(id: string, nombre: string) {
  try {
    await prisma.conversacion.update({ where: { id }, data: { nombre_prospecto: nombre } });
    revalidatePath('/dashboard/inbox');
    return { success: true };
  } catch (e) {
    return { error: 'Error al actualizar el nombre.' };
  }
}

export async function updateNotasLead(id: string, notas: string) {
  try {
    await prisma.conversacion.update({ where: { id }, data: { notas } });
    revalidatePath('/dashboard/inbox');
    return { success: true };
  } catch (e) {
    return { error: 'Error al guardar notas.' };
  }
}

export async function updateEtiquetasLead(id: string, etiquetas: string) {
  try {
    await prisma.conversacion.update({ where: { id }, data: { etiquetas } });
    revalidatePath('/dashboard/inbox');
    return { success: true };
  } catch (e) {
    return { error: 'Error al guardar etiquetas.' };
  }
}

