interface HelpButtonProps {
  onClick: () => void
}

function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <button
      className="help-button"
      type="button"
      aria-label="Help"
      onClick={onClick}
    >
      <svg
        viewBox="0 0 24 24"
        width="1.25rem"
        height="1.25rem"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="17" r="0.9" fill="currentColor" />
      </svg>
    </button>
  )
}

export default HelpButton