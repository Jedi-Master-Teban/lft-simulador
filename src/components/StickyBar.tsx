import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import type { CrewResult, FirmConfig } from '../data/lft';
import { formatMXN } from '../data/lft';

interface Props {
  results: CrewResult[];
  firm: FirmConfig;
  headerRef: React.RefObject<HTMLElement | null>;
}

export function StickyBar({ results, firm, headerRef }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (!headerRef.current) return;
      setVisible(window.scrollY > headerRef.current.offsetHeight);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [headerRef]);

  if (results.length === 0) return null;

  const violating = results.filter(r => !r.isCompliant).length;
  const allOk = violating === 0;
  const totalCost = results.reduce((s, r) => s + r.totalOTCost, 0);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
        backdropFilter: 'blur(8px)',
        background: allOk ? 'rgba(209,250,229,0.97)' : 'rgba(254,226,226,0.97)',
        borderBottom: `1px solid ${allOk ? '#A7F3D0' : '#FECACA'}`,
        borderLeft: `4px solid ${allOk ? '#10B981' : '#EF4444'}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {allOk
            ? <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0" />
            : <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" />}
          <span
            className="text-xs font-bold"
            style={{ color: allOk ? '#065F46' : '#991B1B' }}
          >
            {allOk
              ? `Empresa en cumplimiento — LFT ${firm.year}`
              : `${violating} tripulación${violating !== 1 ? 'es' : ''} con incumplimiento — LFT ${firm.year}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider hidden sm:block">
            Costo TE semanal:
          </span>
          <span
            className="text-sm font-extrabold"
            style={{ color: allOk ? '#065F46' : '#991B1B' }}
          >
            {formatMXN(totalCost)}
          </span>
        </div>
      </div>
    </div>
  );
}
