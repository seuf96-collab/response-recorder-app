import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import CreateCaseForm from './_components/create-case-form';

export default async function NewCasePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Case</h1>
          <p className="text-slate-600">Set up a new jury selection case</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <CreateCaseForm />
        </div>
      </div>
    </div>
  );
}
