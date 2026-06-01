interface ChalkButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function ChalkButton({ label, onClick, disabled = false }: ChalkButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'wood-texture',
        'font-chalk font-bold text-chalk-white',
        'py-3 px-10 rounded',
        'transition-all duration-150',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:brightness-110 active:scale-95',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
