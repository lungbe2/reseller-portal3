import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/auth-options';
import { redirect } from 'next/navigation';
import AdminSidebar from './_components/admin-sidebar';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      {/* Main content area with left padding for sidebar */}
      <div className="lg:pl-64">
        {/* Top padding for mobile header */}
        <main className="pt-16 lg:pt-0">{children}</main>
      </div>
    </div>
  );
}
