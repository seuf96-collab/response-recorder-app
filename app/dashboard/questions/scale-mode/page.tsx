'use client';

import { useState, useEffect } from 'react';
import ScaleModeClient from './_components/scale-mode-client';

export default function ScaleModePage() {
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
    <ScaleModeClient
      caseId={caseId}
      caseName={caseName}
      venireSize={venireSize}
    />
  );
}
