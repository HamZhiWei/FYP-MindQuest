import { ReactNode } from 'react';

interface ChalkFrameProps {
  children: ReactNode;
}

export default function ChalkFrame({ children }: ChalkFrameProps) {
  return (
    <div className="chalk-border rounded-lg p-6 bg-chalk-green-dark bg-opacity-40">
      {children}
    </div>
  );
}
