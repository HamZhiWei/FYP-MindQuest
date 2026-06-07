import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { getAuditLog } from '@/api/adminApi';
import type { AuditEntry } from '@/types';

const FILTERS = ['All', 'login', 'weight_change', 'flag_reviewed', 'export'];

const BADGE: Record<string, string> = {
  login:          'bg-blue-50 text-blue-700',
  weight_change:  'bg-purple-50 text-purple-700',
  flag_reviewed:  'bg-amber-50 text-amber-700',
  export:         'bg-green-50 text-green-700',
};

export default function AuditLogPage() {
  const [entries,  setEntries]  = useState<AuditEntry[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [filter,   setFilter]   = useState('All');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    getAuditLog(page, filter === 'All' ? '' : filter)
      .then(d => { setEntries(d.entries); setTotal(d.total); setPages(d.pages); })
      .finally(() => setLoading(false));
  }, [page, filter]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total entries</p>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filter === f
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No entries</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Action', 'Actor', 'Target', 'Detail', 'Timestamp'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[e.action] ?? 'bg-gray-100 text-gray-600'}`}>
                        {e.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{e.actor}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{e.targetTable ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{e.detail}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(e.occurredAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              ← Prev
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              Next →
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
