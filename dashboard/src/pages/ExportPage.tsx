import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { getStats, downloadExport } from '@/api/adminApi';
import { IoMdDownload } from "react-icons/io";

export default function ExportPage() {
  const [total,    setTotal]   = useState<number | null>(null);
  const [loading,  setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getStats().then(s => setTotal(s.totalSessions));
  }, []);

  async function handleDownload(type: 'pilot' | 'sessions' | 'audit', filename: string) {
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      await downloadExport(type, filename);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  }

  const EXPORTS = [
    {
      id: 'pilot' as const,
      title: 'Pilot study CSV',
      description: 'One row per game session. Includes scenario, demographics, composite index, risk band.',
      filename: 'mindquest_pilot.csv',
      count: total,
    },
    {
      id: 'sessions' as const,
      title: 'Full session scores',
      description: 'All 7 indicator scores + composite index + PSS-10 total per session.',
      filename: 'mindquest_scores.csv',
      count: total,
    },
    {
      id: 'audit' as const,
      title: 'Audit log CSV',
      description: 'All admin actions — logins, weight changes, flag reviews, exports.',
      filename: 'mindquest_audit.csv',
      count: null,
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export Data</h1>
          <p className="text-sm text-gray-500 mt-1">Download anonymised study data as CSV files</p>
        </div>

        <div className="grid grid-cols-1 gap-4 max-w-2xl">
          {EXPORTS.map(({ id, title, description, filename, count }) => (
            <div key={id} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">{description}</p>
                {count !== null && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">{count} sessions available</p>
                )}
              </div>
              <button
                onClick={() => handleDownload(id, filename)}
                disabled={loading[id]}
                className="ml-6 shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                {loading[id] ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Downloading…
                  </>
                ) : (
                  <span className="flex items-center gap-1.5"><IoMdDownload className="shrink-0" /><span>Download</span></span>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-400 max-w-xl bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="font-semibold mb-1 text-gray-500">Anonymisation notice</p>
          Session IDs are truncated to 8 characters. No names, emails, or student IDs are collected or exported.
          All demographic data (gender, faculty, year) is self-reported and stored in aggregate only.
        </div>
      </div>
    </Layout>
  );
}
