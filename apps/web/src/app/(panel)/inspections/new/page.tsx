import type { Metadata } from 'next';
import { ReportInspectionView } from '@/components/inspections/inspections-view';

export const metadata: Metadata = { title: 'Zgłoś przegląd techniczny' };

export default function Page() {
  return <ReportInspectionView />;
}
