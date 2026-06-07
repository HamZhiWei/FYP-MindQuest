import { useEffect, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';
import Layout from '@/components/Layout';
import { getPSS10Correlation } from '@/api/adminApi';

interface CorrelationData {
  n: number;
  pearsonR: number | null;
  dataPoints: { composite: number; pss10Total: number }[];
  perIndicator: { name: string; r: number | null }[];
  bandDistribution: Record<string, number>;
}

const PIE_COLORS = { LOW: '#22c55e', MODERATE: '#f59e0b', HIGH: '#ef4444' };

export default function PSS10CorrelationPage() {
  const [data,    setData]   = useState<CorrelationData | null>(null);
  const [loading, setLoading]= useState(true);

  useEffect(() => {
    getPSS10Correlation()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const rColor = (r: number | null) =>
    r === null ? '#94a3b8' : r >= 0.5 ? '#22c55e' : '#f59e0b';

  const pieData = data
    ? Object.entries(data.bandDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const rLabel = data?.pearsonR !== null && data?.pearsonR !== undefined
    ? data.pearsonR.toFixed(3)
    : '—';

  const rStrength = data?.pearsonR !== null && data?.pearsonR !== undefined
    ? data.pearsonR >= 0.7 ? 'Strong' : data.pearsonR >= 0.5 ? 'Moderate' : 'Weak'
    : '—';

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PSS-10 Correlation</h1>
          <p className="text-sm text-gray-500 mt-1">Pearson r between game composite index and PSS-10 total score</p>
        </div>

        {loading ? (
          <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-4 flex items-center gap-8">
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Participants (n)</p>
              <p className="text-3xl font-bold text-blue-900">{data?.n ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Pearson r</p>
              <p className="text-3xl font-bold text-blue-900">{rLabel}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Correlation strength</p>
              <p className="text-3xl font-bold text-blue-900">{rStrength}</p>
            </div>
            <p className="text-xs text-blue-500 ml-auto max-w-xs">
              r ≥ 0.7 = strong validity. r ≥ 0.5 = moderate. Below 0.5 suggests recalibration needed.
            </p>
          </div>
        )}

        {/* Scatter chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Composite index vs PSS-10 total score</h2>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" dataKey="composite"  name="Composite" domain={[0, 10]} label={{ value: 'Composite index', position: 'insideBottom', offset: -5, fontSize: 11 }} tick={{ fontSize: 11 }} />
              <YAxis type="number" dataKey="pss10Total" name="PSS-10"    domain={[0, 40]} label={{ value: 'PSS-10 score', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={data?.dataPoints ?? []} fill="#3b82f6" opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Indicator correlations + stress band donut */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Pearson r per indicator</h2>
            {loading ? (
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data?.perIndicator ?? []} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => v?.toFixed(3)} />
                  <Bar dataKey="r" radius={3}>
                    {(data?.perIndicator ?? []).map((entry, i) => (
                      <Cell key={i} fill={rColor(entry.r)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <p className="text-xs text-gray-400 mt-2">Green = r ≥ 0.5 · Amber = r &lt; 0.5</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">PSS-10 stress band distribution</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map(entry => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}
