import React from 'react';
import { getTraslados, getAlmacenes, getProductos, getConductores } from './actions';
import TrasladosClient from './TrasladosClient';

export const dynamic = 'force-dynamic';

export default async function TrasladosPage() {
  const traslados = await getTraslados();
  const almacenes = await getAlmacenes();
  const productos = await getProductos();
  const conductores = await getConductores();
  
  return <TrasladosClient 
    initialTraslados={traslados} 
    almacenes={almacenes}
    productos={productos}
    conductores={conductores}
  />;
}
