const hoverSound = new Audio('/assets/audio/hover.wav');
const clickSound = new Audio('/assets/audio/click.wav');

interface WoodButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  width?: number | string;
  height?: number | string;
  fontSize?: number | string;
}

export default function WoodButton({
  label,
  onClick,
  disabled = false,
  width,
  height,
  fontSize,
}: WoodButtonProps) {
  function handleMouseEnter() {
    if (disabled) return;
    hoverSound.currentTime = 0;
    hoverSound.play().catch(() => {});
  }

  function handleClick() {
    if (disabled) return;
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
    onClick();
  }

  return (
    <button
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      disabled={disabled}
      className="wood-button"
      style={{
        ...(width !== undefined && { width: typeof width === 'number' ? `${width}px` : width }),
        ...(height !== undefined && { height: typeof height === 'number' ? `${height}px` : height }),
        ...(fontSize !== undefined && { fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize }),
      }}
    >
      {label}
    </button>
  );
}
