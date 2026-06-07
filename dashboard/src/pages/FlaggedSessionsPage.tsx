import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { getFlagged, reviewFlag } from '@/api/adminApi';
import type { FlaggedSession } from '@/types';

export default function FlaggedSessionsPage() {
  const [sessions, setSessions] = useState<FlaggedSession[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [reviewed, setReviewed] = useState<Record<string, 'keep' | 'exclude'>>({});

  useEffect(() => {
    getFlagged()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  async function handleDecision(id: string, decision: 'keep' | 'exclude') {
    setReviewed(prev => ({ ...prev, [id]: decision }));
    try {
      await reviewFlag(id, decision);
      setSessions(prev => prev.filter(s => s.sessionId !== id));
    } catch {
      setReviewed(prev => { const next = { ...prev }; delete next[id]; return next; });
    }
  }

  const pending = sessions.filter(s => !s.reviewed && !reviewed[s.sessionId]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flagged Sessions</h1>
          <p className="text-sm text-gray-500 mt-1">Sessions flagged by the gaming detector — review before analysis</p>
        </div>

        {!loading && pending.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
            ⚠️ {pending.length} session{pending.length > 1 ? 's' : ''} pending review
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No flagged sessions</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Session ID', 'Scenario', 'Flag reason', 'Avg RT', 'Flagged at', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map(s => {
                  const decision = reviewed[s.sessionId];
                  return (
                    <tr key={s.sessionId} className={`transition-colors ${
                      decision === 'keep'    ? 'bg-green-50' :
                      decision === 'exclude' ? 'bg-red-50 opacity-60' : ''
                    }`}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.sessionId.slice(0, 8)}…</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
                          {s.scenarioId.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{s.flagReason ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {s.avgRtMs != null ? `${(s.avgRtMs / 1000).toFixed(1)}s` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {s.flaggedAt ? new Date(s.flaggedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {s.reviewed ? (
                          <span className="text-xs font-semibold text-gray-500">Reviewed</span>
                        ) : decision ? (
                          <span className={`text-xs font-semibold ${decision === 'keep' ? 'text-green-600' : 'text-red-500'}`}>
                            {decision === 'keep' ? '✓ Kept' : '✗ Excluded'}
                          </span>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => handleDecision(s.sessionId, 'keep')}
                              className="px-3 py-1 text-xs font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors">
                              Keep
                            </button>
                            <button onClick={() => handleDecision(s.sessionId, 'exclude')}
                              className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors">
                              Exclude
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
