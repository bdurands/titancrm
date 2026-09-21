import React from 'react';
import { getLadrillos } from './actions';
import LadrillosClient from './LadrillosClient';

export const dynamic = 'force-dynamic';

export default async function LadrillosPage() {
  const ladrillos = await getLadrillos();
  
  return <LadrillosClient initialLadrillos={ladrillos} />;
}
