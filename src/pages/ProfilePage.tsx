import { useState } from 'react';

const hoverSound = new Audio('/assets/audio/hover.wav');
const clickSound = new Audio('/assets/audio/click.wav');
import { useNavigate } from 'react-router-dom';
import WoodButton from '@/components/WoodButton';
import ChalkFrame from '@/components/ChalkFrame';
import SelectField from '@/components/SelectField';
import { useGame } from '@/context/GameContext';
import { submitProfile } from '@/api/api';
import type { ProfileData } from '@/types';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const AGE_OPTIONS = ['18–20', '21–23', '24–26', '27+'];
const FACULTY_OPTIONS = ['Faculty of Built Environment', 'Faculty of Languages and Linguistics', 'Faculty of Pharmacy', 'Faculty of Engineering', 'Faculty of Education', 'Faculty of Dentistry','Faculty of Business and Economics','Faculty of Medicine','Faculty of Science',''];
const YEAR_OPTIONS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate'];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profileData, setProfileData } = useGame();
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfileData({ ...profileData, [field]: value });
  };

  async function handleNext() {
    setLoading(true);
    try {
      await submitProfile(profileData);
    } catch {
      // Non-blocking — profile is already in context; game can still proceed
      console.warn('Profile submission failed, continuing anyway');
    } finally {
      setLoading(false);
      navigate('/scenarios');
    }
  }

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
              onMouseEnter={() => { hoverSound.currentTime = 0; hoverSound.play().catch(() => {}); }}
              onClick={() => { clickSound.currentTime = 0; clickSound.play().catch(() => {}); navigate('/scenarios'); }}
              
              className="font-chalk text-chalk-white text-lg underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              Skip
            </button>
            
          </div>
          <div className="wood-button-row">
              <WoodButton label="Back" onClick={() => navigate('/consent')} />
              <WoodButton label={loading ? 'Saving…' : 'Next'} onClick={handleNext} disabled={loading} />
            </div>
        </ChalkFrame>
      </div>
    </main>
  );
}
