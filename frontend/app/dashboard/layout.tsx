import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// ─── Dashboard Layout ─────────────────────────────────────────────────────────
// Server component — guards all /dashboard/** routes.
// Redirects unauthenticated visitors to /login.

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {children}
    </div>
  );
}
