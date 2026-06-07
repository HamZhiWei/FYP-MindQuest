interface Props {
  message: string;
  type?: 'error' | 'warning' | 'info';
}

const STYLES = {
  error:   'bg-red-50   border-red-200   text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info:    'bg-blue-50  border-blue-200  text-blue-800',
};
const ICONS = { error: '🔴', warning: '⚠️', info: 'ℹ️' };

export default function AlertBanner({ message, type = 'warning' }: Props) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-3 ${STYLES[type]}`}>
      <span>{ICONS[type]}</span>
      <span>{message}</span>
    </div>
  );
}
