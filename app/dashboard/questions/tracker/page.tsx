'use client';

import { useState, useEffect } from 'react';
import TrackerClient from './_components/tracker-client';

export default function TrackerPage() {
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
    <TrackerClient
      caseId={caseId}
      caseName={caseName}
      venireSize={venireSize}
    />
  );
}
