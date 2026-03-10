import { Suspense } from 'react';
import ScaleModeWrapper from './_components/scale-mode-wrapper';

export default function ScaleModePage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ScaleModeWrapper />
    </Suspense>
  );
}
