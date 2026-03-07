'use client';

import { useState, useEffect } from 'react';
import VoirDireClient from './_components/voir-dire-client';

export default function VoirDirePage() {
  const [venireSize, setVenireSize] = useState(85);
  const [caseName, setCaseName] = useState('State v. Johnson');
  const [defendantName, setDefendantName] = useState('Marcus Johnson');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedVenire = localStorage.getItem('venireSize');
    const savedCase = localStorage.getItem('caseName');
    const savedDefendant = localStorage.getItem('defendantName');
    if (savedVenire) setVenireSize(parseInt(savedVenire));
    if (savedCase) setCaseName(savedCase);
    if (savedDefendant) setDefendantName(savedDefendant);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const caseData = {
    id: 'default-case-1',
    name: caseName,
    causeNumber: null,
    defendantName,
    offenseType: 'criminal',
  };

  const jurors = Array.from({ length: venireSize }, (_, i) => ({
    id: `juror-${i + 1}`,
    jurorNumber: i + 1,
    name: `Juror #${i + 1}`,
    tag: 'NEUTRAL',
  }));

  return <VoirDireClient caseData={caseData} jurors={jurors} />;
}
