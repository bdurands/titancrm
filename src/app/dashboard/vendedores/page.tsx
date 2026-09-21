import React from 'react';
import { getVendedores } from './actions';
import VendedoresClient from './VendedoresClient';

export const dynamic = 'force-dynamic';

export default async function VendedoresPage() {
  const vendedores = await getVendedores();
  return <VendedoresClient initialVendedores={vendedores} />;
}
