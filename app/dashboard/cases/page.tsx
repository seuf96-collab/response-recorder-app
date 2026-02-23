import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { FolderOpen, Plus, Calendar, Scale } from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function CasesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const cases = await prisma.case.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { jurors: true },
      },
    },
  });

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Cases</h1>
          <p className="text-slate-600">Manage your jury selection cases</p>
        </div>
        <Link
          href="/dashboard/cases/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create New Case
        </Link>
      </div>

      {cases?.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No cases yet</h3>
          <p className="text-slate-500 mb-6">Create your first case to start managing jurors</p>
          <Link
            href="/dashboard/cases/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Case
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases?.map?.((c) => (
            <Link
              key={c?.id}
              href={`/dashboard?caseId=${c?.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border border-slate-200 hover:border-blue-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Scale className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{c?.name}</h3>
                    {c?.offenseType && (
                      <p className="text-sm text-slate-600">{c.offenseType}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {c?.date && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(c.date), 'MMM d, yyyy')}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200">
                  <p className="text-slate-700">
                    <span className="font-semibold">{c?._count?.jurors ?? 0}</span> jurors
                  </p>
                </div>
              </div>
            </Link>
          )) ?? null}
        </div>
      )}
    </div>
  );
}
