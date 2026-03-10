'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import ScaleModeClient from './scale-mode-client';
import { useSelectedCase } from '@/lib/use-selected-case';

export default function ScaleModeWrapper() {
  const searchParams = useSearchParams();
  const { caseData, loading } = useSelectedCase();

  const rawSide = searchParams.get('side');
  const side: 'STATE' | 'DEFENSE' = rawSide === 'DEFENSE' ? 'DEFENSE' : 'STATE';

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
        <h2 className="text-2xl font-bold text-white mb-4">No Case Selected</h2>
        <Link href="/dashboard/cases" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg">
          Go to Cases
        </Link>
      </div>
    );
  }

  return (
    <ScaleModeClient
      caseId={caseData.id}
      caseName={caseData.name}
      venireSize={caseData.venireSize}
      side={side}
    />
  );
}
