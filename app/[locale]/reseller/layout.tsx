import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/auth-options';
import { redirect } from 'next/navigation';
import ResellerSidebar from './_components/reseller-sidebar';

export default async function ResellerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'RESELLER') {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ResellerSidebar />
      {/* Main content area with left padding for sidebar */}
      <div className="lg:pl-64">
        {/* Top padding for mobile header */}
        <main className="pt-16 lg:pt-0">{children}</main>
      </div>
    </div>
  );
}
