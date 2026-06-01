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
  return (
    <button
      onClick={onClick}
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
