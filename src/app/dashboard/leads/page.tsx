import React from 'react';
import { getConversaciones } from './actions';
import LeadsClient from './LeadsClient';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const conversaciones = await getConversaciones();
  
  return <LeadsClient initialConversaciones={conversaciones} />;
}
