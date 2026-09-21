import React from 'react';
import { getPedidos, getOptions } from './actions';
import PedidosClient from './PedidosClient';

export const dynamic = 'force-dynamic';

export default async function PedidosPage() {
  const pedidos = await getPedidos();
  const options = await getOptions();
  
  return <PedidosClient 
    initialPedidos={pedidos} 
    clientes={options.clientes}
    productos={options.productos}
    almacenes={options.almacenes}
    camiones={options.camiones}
    vendedores={options.vendedores}
    conductores={options.conductores}
  />;
}
