import { redirect } from 'next/navigation';
import { requireAdmin } from '../../auth/guards.js';

export default async function AdminDashboardPage() {
  await requireAdmin();
  redirect('/admin/shops');
}
