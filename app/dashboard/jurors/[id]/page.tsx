import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import JurorDetailClient from './_components/juror-detail-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function JurorDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const juror = await prisma.juror.findUnique({
    where: { id: params.id },
    include: {
      notes: {
        orderBy: { createdAt: 'desc' },
      },
      tags: true,
      case: true,
    },
  });

  if (!juror) {
    redirect('/dashboard');
  }

  // Transform Prisma result to match client component interface
  const jurorForClient = {
    id: juror.id,
    name: [juror.firstName, juror.lastName].filter(Boolean).join(' ') || 'Unknown',
    seatNumber: juror.jurorNumber?.toString() ?? juror.seatNumber?.toString() ?? '',
    age: juror.age,
    gender: juror.gender,
    occupation: juror.occupation,
    employer: juror.employer,
    educationLevel: juror.educationLevel,
    maritalStatus: juror.maritalStatus,
    numberOfChildren: juror.numberOfChildren,
    childrenAges: juror.childrenAges,
    zipCode: juror.zipCode,
    neighborhood: juror.neighborhood,
    score: juror.overallScore ?? 3,
    tag: juror.tags?.[0]?.tag ?? 'NEUTRAL',
    status: juror.status,
    forCause: juror.forCause,
    notes: juror.notes,
    case: {
      id: juror.case.id,
      name: juror.case.name,
      stateStrikesTotal: juror.case.stateStrikes,
      stateStrikesUsed: juror.case.stateStrikesUsed,
      defenseStrikesTotal: juror.case.defenseStrikes,
      defenseStrikesUsed: juror.case.defenseStrikesUsed,
    },
  };

  return <JurorDetailClient juror={jurorForClient} />;
}
