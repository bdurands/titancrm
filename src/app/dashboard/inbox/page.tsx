import React from 'react';
import { getConversaciones } from '../leads/actions';
import InboxClient from './InboxClient';

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  const conversaciones = await getConversaciones();

  return (
    <InboxClient initialConversaciones={conversaciones} />
  );
}
