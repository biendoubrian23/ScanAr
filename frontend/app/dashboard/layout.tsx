import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';
import { DashboardProviders } from '@/components/layout/DashboardProviders';

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
    <DashboardLayoutClient>
      <DashboardProviders>
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {children}
        </div>
      </DashboardProviders>
    </DashboardLayoutClient>
  );
}
