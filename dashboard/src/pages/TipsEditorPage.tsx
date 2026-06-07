import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { getTips, updateTips } from '../api/adminApi';

const SCENARIOS = [
  { id: 'assignment-deadline', label: 'Assignment Deadline' },
  { id: 'sleep-decisions',     label: 'Sleep Decisions' },
  { id: 'social-interaction',  label: 'Social Interaction' },
];

export default function TipsEditorPage() {
  const [scenario, setScenario]  = useState(SCENARIOS[0].id);
  const [tips,     setTips]      = useState<string[]>([]);
  const [loading,  setLoading]   = useState(false);
  const [saving,   setSaving]    = useState(false);
  const [toast,    setToast]     = useState('');

  useEffect(() => {
    setLoading(true);
    getTips(scenario)
      .then(d => setTips(d.tips))
      .finally(() => setLoading(false));
  }, [scenario]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateTips(scenario, tips);
      setToast('Tips saved successfully!');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Save failed — please try again.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wellbeing Tips</h1>
          <p className="text-sm text-gray-500 mt-1">Edit the advice shown to students after each scenario</p>
        </div>

        {/* Scenario chips */}
        <div className="flex gap-2">
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => setScenario(s.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                scenario === s.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Tips editor */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Tips for {SCENARIOS.find(s => s.id === scenario)?.label}
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xs text-gray-400 mt-2.5 w-5 shrink-0">{i + 1}.</span>
                  <textarea
                    value={tip}
                    onChange={e => {
                      const next = [...tips];
                      next[i] = e.target.value;
                      setTips(next);
                    }}
                    rows={2}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button onClick={() => setTips(tips.filter((_, j) => j !== i))}
                    className="mt-1 text-gray-300 hover:text-red-400 transition-colors text-lg">×</button>
                </div>
              ))}
              <button onClick={() => setTips([...tips, ''])}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                + Add tip
              </button>
            </div>
          )}
          <div className="flex items-center justify-between mt-6">
            {toast ? (
              <span className={`text-sm font-medium ${toast.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>{toast}</span>
            ) : <span />}
            <button onClick={handleSave} disabled={saving || loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
              {saving ? 'Saving…' : 'Save tips'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
