interface EnergyBarProps {
  level: number;
}

const SEGMENTS = 4;

export default function EnergyBar({ level }: EnergyBarProps) {
  const filledSegments = Math.ceil((level / 100) * SEGMENTS);

  return (
    <div className="absolute top-5 right-6 flex items-center select-none z-10">
      <div className="flex items-center gap-0.5 rounded-md border-2 border-white/80 px-1.5 py-1">
        {Array.from({ length: SEGMENTS }, (_, index) => (
          <div
            key={index}
            className={`h-5 w-3 rounded-sm border border-white/50 ${
              index < filledSegments ? 'bg-green-500' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
