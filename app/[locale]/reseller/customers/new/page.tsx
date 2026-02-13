import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import NewCustomerForm from '../../_components/new-customer-form';

export default async function NewCustomerPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Register New Customer</h1>
        <p className="mt-2 text-gray-600">Add a new customer to your portfolio</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <NewCustomerForm />
      </div>
    </div>
  );
}
