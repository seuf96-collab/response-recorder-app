import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import VoirDireClient from './_components/voir-dire-client';

export const dynamic = 'force-dynamic';

export default async function VoirDirePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const activeCase = await prisma.case.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!activeCase) {
    redirect('/dashboard/cases/new');
  }

  const jurors = await prisma.juror.findMany({
    where: { caseId: activeCase.id, status: 'ACTIVE' },
    orderBy: { jurorNumber: 'asc' },
    include: { tags: true },
  });

  return (
    <VoirDireClient
      caseData={JSON.parse(JSON.stringify({
        id: activeCase.id,
        name: activeCase.name,
        causeNumber: activeCase.causeNumber,
        defendantName: activeCase.defendantName,
        offenseType: activeCase.offenseType,
      }))}
      jurors={JSON.parse(JSON.stringify(
        jurors.map((j) => ({
          id: j.id,
          jurorNumber: j.jurorNumber,
          name: [j.firstName, j.lastName].filter(Boolean).join(' ') || 'Unknown',
          tag: j.tags?.[0]?.tag ?? 'NEUTRAL',
        }))
      ))}
    />
  );
}
