interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'red' | 'green' | 'amber';
}

const COLORS = {
  blue:  'bg-blue-50  border-blue-100  text-blue-800',
  red:   'bg-red-50   border-red-100   text-red-800',
  green: 'bg-green-50 border-green-100 text-green-800',
  amber: 'bg-amber-50 border-amber-100 text-amber-800',
};

export default function MetricCard({ title, value, subtitle, color = 'blue' }: Props) {
  return (
    <div className={`rounded-xl border p-5 ${COLORS[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
      {subtitle && <p className="text-xs opacity-50 mt-1">{subtitle}</p>}
    </div>
  );
}
