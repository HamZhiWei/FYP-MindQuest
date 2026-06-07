import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import Layout from '@/components/Layout';
import MetricCard from '@/components/MetricCard';
import AlertBanner from '@/components/AlertBanner';
import { getStats, getTrend, toGameParam, toPeriodParam } from '@/api/adminApi';
import type { DashboardStats } from '@/types';

const SCENARIOS = ['All', 'assignment-deadline', 'sleep-decisions', 'social-interaction'];
const PERIODS   = ['Full semester', 'Mid-term', 'Finals'];
const PIE_COLORS = { LOW: '#22c55e', MODERATE: '#f59e0b', HIGH: '#ef4444' };

function heatColor(val: number | null) {
  if (val === null) return 'bg-gray-100 text-gray-400';
  if (val <= 3.5)  return 'bg-green-100 text-green-800';
  if (val <= 6.5)  return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

export default function OverviewPage() {
  const [stats,    setStats]   = useState<DashboardStats | null>(null);
  const [trend,    setTrend]   = useState<{ weeks: { week: string; composite: number | null }[] } | null>(null);
  const [scenario, setScenario]= useState('All');
  const [period,   setPeriod]  = useState('Full semester');
  const [loading,  setLoading] = useState(true);
  const [highRisk, setHighRisk]= useState(false);

  useEffect(() => {
    setLoading(true);
    const game = toGameParam(scenario);
    const periodParam = toPeriodParam(period);
    console.log("Fetching stats with params:", { game, period: periodParam });
    Promise.all([getStats(game, periodParam), getTrend(game, periodParam)])
      .then(([s, t]) => {
        setStats(s);
        setTrend(t);
        const pct = (s.riskBands['HIGH'] || 0) / Math.max(s.totalSessions, 1) * 100;
        setHighRisk(pct > 20);
      })
      .finally(() => setLoading(false));
  }, [scenario, period]);

  const pieData = stats
    ? Object.entries(stats.riskBands).map(([name, value]) => ({ name, value }))
    : [];

  const avgComposite = trend?.weeks
    ? (() => {
        const vals = trend.weeks.map(w => w.composite).filter(Boolean) as number[];
        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : '—';
      })()
    : '—';

  const highRiskRate = stats
    ? (((stats.riskBands['HIGH'] || 0) / Math.max(stats.totalSessions, 1)) * 100).toFixed(1) + '%'
    : '—';

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Semester analytics · Faculty of Computing</p>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            {SCENARIOS.map(s => (
              <button key={s} onClick={() => setScenario(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  scenario === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}>
                {s === 'All' ? 'All' : s.replace('-', ' ').replace(/^\w/, c => c.toUpperCase())}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  period === p
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {highRisk && (
          <AlertBanner
            type="error"
            message="High-risk rate exceeds 20% this period. Review flagged sessions."
          />
        )}

        {/* Metric cards */}
        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="Total sessions"     value={stats?.totalSessions ?? 0}  color="blue" />
            <MetricCard title="Avg composite index" value={avgComposite}              color="blue" />
            <MetricCard title="High-risk rate"     value={highRiskRate}               color={highRisk ? 'red' : 'green'} />
            <MetricCard title="Flagged sessions"   value={stats?.flaggedSessions ?? 0} color="amber" subtitle="Pending review" />
          </div>
        )}

        {/* Trend line chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Composite index trend (W1–W14)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend?.weeks ?? []} margin={{ right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={6.5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Threshold', position: 'right', fontSize: 11, fill: '#ef4444' }} />
              <Line type="monotone" dataKey="composite" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls name="Composite index" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap + Donut */}
        <div className="grid grid-cols-2 gap-6">
          {/* Semester heatmap */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Semester heatmap</h2>
            <div className="grid grid-cols-7 gap-2">
              {(trend?.weeks ?? Array(14).fill({ week: '—', composite: null })).map((w, i) => (
                <div key={i} className={`rounded-lg p-2 text-center ${heatColor(w.composite)}`}>
                  <p className="text-xs font-bold">{w.week}</p>
                  <p className="text-xs mt-0.5">{w.composite !== null ? w.composite.toFixed(1) : '—'}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> LOW ≤ 3.5</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 inline-block" /> MOD ≤ 6.5</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> HIGH &gt; 6.5</span>
            </div>
          </div>

          {/* Risk band donut */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Risk band distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          All data is anonymised. Session IDs are truncated. No personally identifiable information is displayed.
        </p>
      </div>
    </Layout>
  );
}
