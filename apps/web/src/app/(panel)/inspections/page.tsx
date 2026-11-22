import type { Metadata } from 'next';
import { InspectionsView } from '@/components/inspections/inspections-view';

export const metadata: Metadata = { title: 'Przeglądy techniczne' };

export default function Page() {
  return <InspectionsView />;
}
