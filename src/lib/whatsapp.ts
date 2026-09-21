export async function sendWhatsAppNotification(
  phone: string,
  clienteNombre: string,
  cantidad: number,
  productoTipo: string
) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'notificacion_envio';

  if (!token || !phoneId) {
    console.warn("WhatsApp API no configurada. Faltan Tokens en el archivo .env");
    return { success: false, error: 'Faltan credenciales de WhatsApp' };
  }

  // Aseguramos que el teléfono tenga código de país (Perú = 51)
  const formattedPhone = phone.startsWith('51') ? phone : `51${phone}`;

  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

  const data = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: "es" // Español
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: clienteNombre // {{1}}
            },
            {
              type: "text",
              text: cantidad.toString() // {{2}}
            },
            {
              type: "text",
              text: productoTipo // {{3}}
            }
          ]
        }
      ]
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Error desde WhatsApp API:", result);
      return { success: false, error: result.error?.message || 'Error desconocido' };
    }

    return { success: true, result };
  } catch (error: any) {
    console.error("Excepción llamando a WhatsApp API:", error);
    return { success: false, error: error.message };
  }
}
