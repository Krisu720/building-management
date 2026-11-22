import type { Metadata } from 'next';
import { ResidentsView } from '@/components/residents/residents-view';

export const metadata: Metadata = { title: 'Mieszkańcy' };

export default function Page() {
  return <ResidentsView />;
}
