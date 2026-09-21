import React from 'react';
import { getCamiones } from './actions';
import FlotaClient from './FlotaClient';

export const dynamic = 'force-dynamic';

export default async function FlotaPage() {
  const camiones = await getCamiones();
  
  return <FlotaClient initialCamiones={camiones} />;
}
