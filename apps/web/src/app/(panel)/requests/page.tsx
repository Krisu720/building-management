import type { Metadata } from 'next';
import { RequestsView } from '@/components/requests/requests-view';

export const metadata: Metadata = { title: 'Zgłoszenia' };

export default function RequestsPage() {
  return <RequestsView />;
}
