import type { ChangeEvent } from 'react';
import type { ProfileData } from '@/types';

const clickSound = new Audio('/assets/audio/click.wav');

interface SelectFieldProps {
  label: string;
  field: keyof ProfileData;
  value: string;
  options: string[];
  onChange: (field: keyof ProfileData, value: string) => void;
}

export default function SelectField({ label, field, value, options, onChange }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="font-chalk text-chalk-white text-lg">{label}</label>
      <select
        value={value}
        onClick={() => { clickSound.currentTime = 0; clickSound.play().catch(() => {}); }}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(field, e.target.value)}
        className="bg-chalk-green-dark text-chalk-white font-chalk border border-chalk-white/50 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-chalk-white/40"
      >
        <option value="">— select —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
