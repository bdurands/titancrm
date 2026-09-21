'use server'

import { Prisma, PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function marcarComoEntregado(formData: FormData) {
  try {
    const dispatch_uuid = formData.get('dispatch_uuid') as string;
    const cobro_realizado = formData.get('cobro_realizado') === 'true';
    
    return await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { dispatch_uuid },
        include: { origen_almacen: true }
      });

      if (!pedido) throw new Error("Pedido no encontrado");
      if (pedido.estado === 'entregado') throw new Error("Este pedido ya fue entregado.");

      let pagosArray: any[] = [];
      let metodosUsados = new Set<string>();

      if (cobro_realizado) {
        const pagosCount = parseInt(formData.get('pagos_count') as string || '0');
        for (let i = 0; i < pagosCount; i++) {
          const monto = parseFloat(formData.get(`pago_${i}_monto`) as string);
          const metodo = formData.get(`pago_${i}_metodo`) as string;
          const nro_operacion = formData.get(`pago_${i}_nro_operacion`) as string;
          const file = formData.get(`pago_${i}_file`) as File | null;
          
          let fotoUrl = null;
          if (file && file.size > 0) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const uniqueName = Date.now() + '-' + file.name;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            fs.writeFileSync(path.join(uploadDir, uniqueName), buffer);
            fotoUrl = `/uploads/${uniqueName}`;
          }

          if (!isNaN(monto) && monto > 0) {
            pagosArray.push({
              metodo,
              monto,
              nro_operacion: nro_operacion || null,
              foto_comprobante: fotoUrl
            });
            metodosUsados.add(metodo);
          }
        }
      }

      // Lógica inteligente para sobreescribir el método de pago principal
      let nuevoTipoPago = pedido.tipo_pago; // por defecto mantiene el original
      if (cobro_realizado && metodosUsados.size > 0) {
        if (metodosUsados.size === 1) {
          nuevoTipoPago = Array.from(metodosUsados)[0]; // Si solo usó Yape, el pedido pasa a Yape
        } else {
          nuevoTipoPago = 'Mixto'; // Si usó Yape y Efectivo, pasa a Mixto
        }
      }

      // Descontar stock
      if (!pedido.origen_almacen.es_planta_choque) {
        const stockOrigen = await tx.stock.findUnique({
          where: { almacen_id_producto_id: { almacen_id: pedido.origen_almacen_id, producto_id: pedido.producto_id } }
        });
        if (!stockOrigen || stockOrigen.cantidad_disponible < pedido.cantidad) {
          throw new Error("Stock insuficiente en origen para finalizar la entrega.");
        }
        await tx.stock.update({
          where: { id: stockOrigen.id },
          data: { cantidad_disponible: { decrement: pedido.cantidad } }
        });
      }

      // Actualizar pedido
      await tx.pedido.update({
        where: { dispatch_uuid },
        data: {
          estado: 'entregado',
          cobro_realizado_chofer: cobro_realizado,
          pagos_chofer: pagosArray.length > 0 ? pagosArray : Prisma.JsonNull,
          tipo_pago: nuevoTipoPago
        }
      });

      return { success: true };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    revalidatePath('/dashboard/pedidos');
  }
}
