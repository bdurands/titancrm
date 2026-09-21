import React from 'react';
import { getConductores } from './actions';
import { getCamiones } from '../flota/actions';
import ConductoresClient from './ConductoresClient';

export const dynamic = 'force-dynamic';

export default async function ConductoresPage() {
  const conductores = await getConductores();
  const camiones = await getCamiones();
  
  return <ConductoresClient initialConductores={conductores} camionesDisponibles={camiones} />;
}
