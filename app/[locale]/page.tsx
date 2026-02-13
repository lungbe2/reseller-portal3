import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/auth-options';

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const session = await getServerSession(authOptions);

  if (session?.user) {
    // Redirect based on role
    const userRole = (session.user as any).role;
    if (userRole === 'ADMIN') {
      redirect(`/${locale}/admin/dashboard`);
    } else {
      redirect(`/${locale}/reseller/dashboard`);
    }
  }

  // If not logged in, redirect to login
  redirect(`/${locale}/login`);
}
