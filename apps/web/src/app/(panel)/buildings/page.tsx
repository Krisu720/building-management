import type { Metadata } from 'next';
import { BuildingsView } from '@/components/buildings/buildings-view';

export const metadata: Metadata = { title: 'Budynki' };

export default function Page() {
  return <BuildingsView />;
}
