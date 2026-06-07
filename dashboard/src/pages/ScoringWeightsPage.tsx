import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { getWeights, activateWeight, getStudyConfig, updateStudyConfig, backfillSemesterWeeks } from '@/api/adminApi';

interface WeightVersion {
  id: string;
  versionLabel: string;
  isActive: boolean;
  pilotPearsonR: number | null;
  appliedAt: string | null;
  calibrationNote: string | null;
  indicatorWeights: Record<string, Record<string, number>>;
  wGameDeadline: number;
  wGameSleep: number;
  wGameSocial: number;
}

const EMPTY_WEEKS = Array(14).fill('') as string[];

export default function ScoringWeightsPage() {
  const [versions,     setVersions]    = useState<WeightVersion[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [activating,   setActivating]  = useState<string | null>(null);

  const [semesterWeeks, setSemesterWeeks] = useState<string[]>(EMPTY_WEEKS);
  const [configSaving,   setConfigSaving]  = useState(false);
  const [configToast,    setConfigToast]   = useState('');
  const [backfilling,    setBackfilling]   = useState(false);
  const [backfillToast,  setBackfillToast] = useState('');

  useEffect(() => {
    getWeights().then(d => setVersions(d.versions)).finally(() => setLoading(false));
    getStudyConfig().then(d => {
      const weeks = d.semesterWeeks ?? [];
      // Pad to 14 slots so every input is always controlled
      const padded = Array(14).fill('').map((_, i) => weeks[i] ?? '');
      setSemesterWeeks(padded);
    });
  }, []);

  function handleWeekChange(index: number, value: string) {
    setSemesterWeeks(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleBackfill() {
    setBackfilling(true);
    try {
      const { updated } = await backfillSemesterWeeks();
      setBackfillToast(`${updated} session${updated !== 1 ? 's' : ''} tagged`);
    } catch {
      setBackfillToast('Backfill failed');
    } finally {
      setBackfilling(false);
      setTimeout(() => setBackfillToast(''), 4000);
    }
  }

  async function handleSaveConfig() {
    setConfigSaving(true);
    try {
      // Send nulls for blank entries so backend stores them correctly
      await updateStudyConfig(semesterWeeks.map(w => w || null));
      setConfigToast('Saved');
    } catch {
      setConfigToast('Save failed');
    } finally {
      setConfigSaving(false);
      setTimeout(() => setConfigToast(''), 3000);
    }
  }

  async function handleActivate(id: string) {
    setActivating(id);
    try {
      await activateWeight(id);
      setVersions(prev => prev.map(v => ({ ...v, isActive: v.id === id })));
    } finally {
      setActivating(null);
    }
  }

  const active = versions.find(v => v.isActive);

  const flatWeights = active
    ? Object.entries(active.indicatorWeights).flatMap(([scenario, weights]) =>
        Object.entries(weights).map(([ind, w]) => ({
          label: `${scenario} · ${ind}`,
          value: w,
        }))
      )
    : [];

  const filledCount = semesterWeeks.filter(Boolean).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scoring Weights</h1>
          <p className="text-sm text-gray-500 mt-1">Manage scoring weight versions. Activate after pilot calibration.</p>
        </div>

        {/* Study period */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Study Period</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Enter the start date (Monday) of each teaching week. Leave break weeks blank — they are automatically skipped.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-6">
              {configToast && (
                <span className={`text-sm font-medium ${configToast === 'Saved' ? 'text-green-600' : 'text-red-600'}`}>
                  {configToast}
                </span>
              )}
              <span className="text-xs text-gray-400">{filledCount}/14 weeks set</span>
              <button
                onClick={handleSaveConfig}
                disabled={configSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {configSaving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={handleBackfill}
                disabled={backfilling || filledCount === 0}
                title="Tag existing sessions that are missing a semester week"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
              >
                {backfilling ? 'Backfilling…' : 'Backfill existing'}
              </button>
              {backfillToast && (
                <span className={`text-sm font-medium ${backfillToast.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
                  {backfillToast}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {semesterWeeks.map((date, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-14 shrink-0 font-medium">Week {i + 1}</span>
                <input
                  type="date"
                  value={date}
                  onChange={e => handleWeekChange(i, e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Version table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Version', 'Pearson r', 'Applied at', 'Note', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {versions.map(v => (
                  <tr key={v.id} className={v.isActive ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-800">{v.versionLabel}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {v.pilotPearsonR !== null ? (
                        <span className={`font-semibold ${v.pilotPearsonR >= 0.5 ? 'text-green-600' : 'text-amber-600'}`}>
                          {v.pilotPearsonR.toFixed(3)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {v.appliedAt ? new Date(v.appliedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{v.calibrationNote ?? '—'}</td>
                    <td className="px-4 py-3">
                      {v.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-semibold">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!v.isActive && (
                        <button onClick={() => handleActivate(v.id)} disabled={activating === v.id}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                          {activating === v.id ? 'Activating…' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Active version detail */}
        {active && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Active version: {active.versionLabel}</h2>
            <p className="text-xs text-gray-400 mb-5">Scenario weights: Deadline {(active.wGameDeadline * 100).toFixed(0)}% · Sleep {(active.wGameSleep * 100).toFixed(0)}% · Social {(active.wGameSocial * 100).toFixed(0)}%</p>
            <div className="space-y-2">
              {flatWeights.map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-52 shrink-0">{label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${value * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-600 w-10 text-right">{(value * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
