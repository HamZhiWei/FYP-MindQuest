import { type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import WoodButton from '../components/WoodButton';
import ChalkFrame from '../components/ChalkFrame';
import { useGame } from '../context/GameContext';
import type { ProfileData } from '../types';

interface SelectFieldProps {
  label: string;
  field: keyof ProfileData;
  value: string;
  options: string[];
  onChange: (field: keyof ProfileData, value: string) => void;
}

function SelectField({ label, field, value, options, onChange }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="font-chalk text-chalk-white text-lg">{label}</label>
      <select
        value={value}
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

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const AGE_OPTIONS = ['18–20', '21–23', '24–26', '27+'];
const FACULTY_OPTIONS = ['Computing', 'Engineering', 'Science', 'Business', 'Arts', 'Other'];
const YEAR_OPTIONS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate'];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profileData, setProfileData } = useGame();

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfileData({ ...profileData, [field]: value });
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-chalk-green text-chalk-white font-chalk p-8">
      <div className="w-full max-w-lg">
        <ChalkFrame>
          <h1 className="text-4xl font-bold text-chalk-white font-chalk mb-2">
            About You
          </h1>
          <p className="text-xl text-chalk-white mb-6">
            Please provide some basic information for analysis (all anonymous)
          </p>
          <div className="flex flex-col gap-5 mb-8">
            <SelectField
              label="Gender"
              field="gender"
              value={profileData.gender ?? ''}
              options={GENDER_OPTIONS}
              onChange={handleChange}
            />
            <SelectField
              label="Age Group"
              field="ageGroup"
              value={profileData.ageGroup ?? ''}
              options={AGE_OPTIONS}
              onChange={handleChange}
            />
            <SelectField
              label="Faculty"
              field="faculty"
              value={profileData.faculty ?? ''}
              options={FACULTY_OPTIONS}
              onChange={handleChange}
            />
            <SelectField
              label="Year of Study"
              field="yearOfStudy"
              value={profileData.yearOfStudy ?? ''}
              options={YEAR_OPTIONS}
              onChange={handleChange}
            />
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/scenarios')}
              className="font-chalk text-chalk-white text-lg underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              Skip
            </button>
            
          </div>
          <div className="wood-button-row">
              <WoodButton label="Back" onClick={() => navigate('/consent')} />
              <WoodButton label="Next" onClick={() => navigate('/scenarios')} />
            </div>
        </ChalkFrame>
      </div>
    </main>
  );
}
