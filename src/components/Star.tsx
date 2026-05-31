interface StarProps {
  size?: number;
  className?: string;
  spinning?: boolean;
}

/** The 4-point star motif — the product's only ornament. */
export const Star = ({ size = 16, className = "", spinning = false }: StarProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={`inline-block ${spinning ? "animate-star-spin" : ""} ${className}`}
  >
    <path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z" />
  </svg>
);

/** Hairline divider with a centered star — section break. */
export const StarDivider = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-4 my-12 ${className}`} aria-hidden="true">
    <div className="flex-1 h-px bg-border" />
    <Star size={12} className="text-ink-soft" />
    <div className="flex-1 h-px bg-border" />
  </div>
);
