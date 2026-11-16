import type { Metadata } from 'next';
import { MyRequestsView } from '@/components/requests/requests-view';

export const metadata: Metadata = { title: 'Moje zgłoszenia' };

export default function MyRequestsPage() {
  return <MyRequestsView />;
}
