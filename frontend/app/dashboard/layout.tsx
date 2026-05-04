import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardProviders } from '@/components/layout/DashboardProviders';

// Server component — guards all /dashboard/** routes and renders the
// persistent shell (Sidebar + providers). The Sidebar is mounted here so it
// stays alive across page navigation; pages only render their header + main
// content via <DashboardShell>.

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
    <div className="flex h-screen w-full overflow-hidden bg-surface">
      <Sidebar />
      <DashboardProviders>
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {children}
        </div>
      </DashboardProviders>
    </div>
  );
}
