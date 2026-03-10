'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import QuestionBankClient from './_components/question-bank-client';
import { useSelectedCase } from '@/lib/use-selected-case';

export default function QuestionsPage() {
  const { caseData, loading } = useSelectedCase();

  if (loading) {
    return (
      <div className="p-6 dark:bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-6 dark:bg-slate-950 min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold dark:text-white mb-4">No Case Selected</h2>
        <Link href="/dashboard/cases" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg">
          Go to Cases
        </Link>
      </div>
    );
  }

  return (
    <QuestionBankClient
      caseId={caseData.id}
      caseName={caseData.name}
    />
  );
}
