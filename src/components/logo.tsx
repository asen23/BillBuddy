export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
        <path
          d="M6 3h12v16.4l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2V3Z"
          className="fill-card stroke-foreground"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M9 8.5h6M9 12h6M9 15.5h3"
          className="stroke-muted-foreground"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-base font-semibold tracking-tight">BillBuddy</span>
    </span>
  );
}
