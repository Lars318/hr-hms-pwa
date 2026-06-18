interface Props {
  className?: string;
  size?: number;
}

export function PulsfolloLogo({ className, size = 28 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Hode */}
      <ellipse cx="60" cy="15" rx="12" ry="13" fill="#E05A25" />
      {/* Venstre arm (opp-venstre til ned-høyre gjennom midten) */}
      <ellipse cx="60" cy="55" rx="44" ry="10" transform="rotate(-38 60 55)" fill="#E05A25" />
      {/* Høyre arm (opp-høyre til ned-venstre gjennom midten) */}
      <ellipse cx="60" cy="55" rx="44" ry="10" transform="rotate(38 60 55)" fill="#E05A25" />
      {/* Venstre bein */}
      <ellipse cx="60" cy="90" rx="44" ry="10" transform="rotate(38 60 90)" fill="#E05A25" />
      {/* Høyre bein */}
      <ellipse cx="60" cy="90" rx="44" ry="10" transform="rotate(-38 60 90)" fill="#E05A25" />
    </svg>
  );
}
