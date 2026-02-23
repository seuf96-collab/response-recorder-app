'use client';

import { useState, useEffect } from 'react';
import ResponseRecorderClient from './_components/response-recorder-client';

interface PageProps {
  searchParams: { caseId?: string; questionId?: string; jurorId?: string };
}

export default function ResponsesPage({ searchParams }: PageProps) {
  const caseId = 'default-case-1';
  const caseName = 'State v. Johnson';
  const [venireSize, setVenireSize] = useState(85);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('venireSize');
    if (saved) {
      setVenireSize(parseInt(saved));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>;
  }

  return (
    <ResponseRecorderClient
      caseId={caseId}
      caseName={caseName}
      questionId={searchParams.questionId}
      jurorId={searchParams.jurorId}
      venireSize={venireSize}
    />
  );
}
