'use client';

import { useState, useEffect } from 'react';
import StrikeModeClient from './_components/strike-mode-client';

export default function StrikeModePage() {
  const caseId = 'default-case-1';
  const [caseName, setCaseName] = useState('State v. Johnson');
  const [venireSize, setVenireSize] = useState(85);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedName = localStorage.getItem('caseName');
    const savedVenireSize = localStorage.getItem('venireSize');
    if (savedName) setCaseName(savedName);
    if (savedVenireSize) setVenireSize(parseInt(savedVenireSize));
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <StrikeModeClient
      caseId={caseId}
      caseName={caseName}
      venireSize={venireSize}
    />
  );
}
