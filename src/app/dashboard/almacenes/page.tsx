import React from 'react';
import { getAlmacenes } from './actions';
import AlmacenesClient from './AlmacenesClient';

export const dynamic = 'force-dynamic';

export default async function AlmacenesPage() {
  const almacenes = await getAlmacenes();
  
  return <AlmacenesClient initialAlmacenes={almacenes} />;
}
