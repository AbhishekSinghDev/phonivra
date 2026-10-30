export function DesktopMenuBar(): React.JSX.Element {
  return (
    <div
      data-desktop-menu=""
      aria-hidden="true"
      className="flex items-center justify-between bg-background/60 text-foreground backdrop-blur-lg"
    >
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.8 12.7c0-2 1.6-3 1.7-3.1-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8s-1.8-.8-2.9-.8c-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.2 2.8 2.1 1.1 0 1.6-.7 3-.7s1.8.7 3 .7 2-1 2.7-2.1c.9-1.2 1.2-2.4 1.2-2.5-.1 0-2.3-.9-2.3-3.9ZM14.6 6.5c.6-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.4-.6.7-1.2 1.8-1.1 2.8 1 .1 2.1-.5 2.8-1.2Z" />
        </svg>
        <span className="font-semibold">Phonivra</span>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Window</span>
        <span>Help</span>
      </div>
      <div className="flex items-center gap-3">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M3 9a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0M9 15a4.5 4.5 0 0 1 6 0" />
          <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="6" width="18" height="12" rx="3" />
          <path d="M22 10v4" />
          <rect x="5" y="9" width="12" height="6" rx="1" fill="currentColor" stroke="none" />
        </svg>
        <span className="tabular-nums">9:41</span>
      </div>
    </div>
  )
}
