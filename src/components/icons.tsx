import type { ToolCategory } from "@/content/tools";

interface IconProps {
  className?: string;
}

/**
 * A tiny, dependency-free icon set (stroke-based, 24x24, currentColor) used for tool categories
 * and a few individual tools. Matches the line style already used by BrandMark and ThemeToggle.
 */
function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </Svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.6 4 5.7 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.7-4-9s1.4-6.4 4-9Z" />
    </Svg>
  );
}

export function TerminalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M7 9.5 10.2 12 7 14.5M12.5 14.5h4.5" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.35-4.35" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h13M13 6l6 6-6 6" />
    </Svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5c-.8 0-1.5-.7-1.5-1.5z" />
      <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5c.8 0 1.5-.7 1.5-1.5z" />
    </Svg>
  );
}

export function FlaskIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 2v7.31L4.1 19.46A2 2 0 0 0 5.8 22h12.4a2 2 0 0 0 1.7-2.54L14 9.31V2" />
      <path d="M8.5 2h7M14 9.3a6.5 6.5 0 0 0-4 0M7 16h10" />
    </Svg>
  );
}

const CATEGORY_ICONS: Record<ToolCategory, (props: IconProps) => React.ReactElement> = {
  Timestamp: ClockIcon,
  "Date & Duration": CalendarIcon,
  "Time Zones": GlobeIcon,
  Developer: TerminalIcon,
  Labs: FlaskIcon,
};

export function CategoryIcon({ category, className }: { category: ToolCategory; className?: string }) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon className={className} />;
}
