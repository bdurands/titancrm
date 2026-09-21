import React from 'react';
import { getClientes } from './actions';
import ClientesClient from './ClientesClient';

export const dynamic = 'force-dynamic';

export default async function ClientesPage() {
  const clientes = await getClientes();
  
  return <ClientesClient initialClientes={clientes} />;
}
