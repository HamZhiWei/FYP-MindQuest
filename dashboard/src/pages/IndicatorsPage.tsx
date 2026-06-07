import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import Layout from '@/components/Layout';
import { getIndicators, getRtAnalysis } from '@/api/adminApi';

interface IndicatorRow { name: string; value: number; }
interface RtRow        { node: string; avgRt: number; }

export default function IndicatorsPage() {
  const [indicators, setIndicators] = useState<IndicatorRow[]>([]);
  const [rtPerNode,  setRtPerNode]  = useState<RtRow[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([getIndicators(), getRtAnalysis()])
      .then(([ind, rt]) => {
        setIndicators(ind.indicators);
        setRtPerNode(rt);
      })
      .finally(() => setLoading(false));
  }, []);

  const barColor = (value: number) =>
    value >= 7 ? '#ef4444' : value >= 4 ? '#f59e0b' : '#22c55e';

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Indicators</h1>
          <p className="text-sm text-gray-500 mt-1">Average score per wellbeing indicator (0–10)</p>
        </div>

        {loading ? (
          <div className="h-72 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">All 7 indicators</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={indicators} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={4}>
                  {indicators.map((entry, i) => (
                    <Cell key={i} fill={barColor(entry.value)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block" /> Low (&lt; 4)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Moderate (4–7)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> High (&gt; 7)</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Avg reaction time per decision node (seconds)</h2>
          <p className="text-xs text-gray-400 mb-4">Baseline: 4s — values above may indicate overthinking or hesitation</p>
          {loading ? (
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rtPerNode}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="node" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v}s`} />
                <ReferenceLine y={4} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Baseline 4s', position: 'right', fontSize: 11, fill: '#f59e0b' }} />
                <Bar dataKey="avgRt" fill="#3b82f6" radius={4} name="Avg RT (s)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Layout>
  );
}
