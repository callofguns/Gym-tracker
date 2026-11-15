import type { ReactNode, SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function S({ size = 24, children, ...rest }: P & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconPerson = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <circle cx="12" cy="7.5" r="4.5" />
    <path d="M3.5 20.5c0-4.2 3.8-7 8.5-7s8.5 2.8 8.5 7v.5h-17z" />
  </S>
)

export const IconHistory = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v5.2l3.6 2.2-1 1.7L11 13.3V7z" />
  </S>
)

export const IconPlus = (p: P) => (
  <S {...p} strokeWidth={2.6}>
    <path d="M12 4v16M4 12h16" />
  </S>
)

export const IconDumbbell = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <rect x="1.5" y="9" width="2" height="6" rx="1" />
    <rect x="4" y="6" width="3.5" height="12" rx="1.2" />
    <rect x="7.5" y="10.6" width="9" height="2.8" />
    <rect x="16.5" y="6" width="3.5" height="12" rx="1.2" />
    <rect x="20.5" y="9" width="2" height="6" rx="1" />
  </S>
)

export const IconGear = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10.3 2h3.4l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.7 2.9-2 1.7c.1.6.1 1.3 0 1.9l2 1.7-1.7 2.9-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.2-.5-1.7-.9l-2.5.9-1.7-2.9 2-1.7a6 6 0 0 1 0-1.9l-2-1.7 1.7-2.9 2.5.9c.5-.4 1.1-.7 1.7-.9zM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z"
      transform="translate(0 1)"
    />
  </S>
)

export const IconSearch = (p: P) => (
  <S {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 21 21" />
  </S>
)

export const IconDots = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <circle cx="5" cy="12" r="2.1" />
    <circle cx="12" cy="12" r="2.1" />
    <circle cx="19" cy="12" r="2.1" />
  </S>
)

export const IconCheck = (p: P) => (
  <S {...p} strokeWidth={2.6}>
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
  </S>
)

export const IconClose = (p: P) => (
  <S {...p} strokeWidth={2.4}>
    <path d="M6 6l12 12M18 6 6 18" />
  </S>
)

export const IconTimer = (p: P) => (
  <S {...p} strokeWidth={2.2}>
    <path d="M12 3.5a8.5 8.5 0 1 1-7.4 4.3" />
    <path d="M12 3.5V7" />
    <path d="m8.2 8.2 4.3 4.3" />
  </S>
)

export const IconCalendar = (p: P) => (
  <S {...p} strokeWidth={1.6}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17" />
    <path d="M7 13h.01M10.3 13h.01M13.6 13h.01M17 13h.01M7 16.3h.01M10.3 16.3h.01M13.6 16.3h.01" strokeWidth={2.2} />
  </S>
)

export const IconClock = (p: P) => (
  <S {...p} strokeWidth={1.8}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </S>
)

export const IconClockSolid = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zm.9 4.5v4.6l3.3 2-.9 1.6-4.2-2.6V7z" />
  </S>
)

/** Superset / link icon: three linked dots on a diagonal. */
export const IconLink = (p: P) => (
  <S {...p} strokeWidth={2}>
    <path d="M6.5 17.5 17.5 6.5" />
    <circle cx="5.5" cy="18.5" r="2.4" fill="currentColor" />
    <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    <circle cx="18.5" cy="5.5" r="2.4" fill="currentColor" />
  </S>
)

export const IconWeight = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <path d="M9.5 3.5a2.5 2.5 0 0 1 5 0v1h-1.6v-1a.9.9 0 0 0-1.8 0v1H9.5z" />
    <path d="M7.4 6h9.2l3.4 13.5a1 1 0 0 1-1 1.2H5a1 1 0 0 1-1-1.2z" />
  </S>
)

export const IconTrophy = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <path d="M7 3h10v2h3.5v2.5a4.5 4.5 0 0 1-4.1 4.5A5 5 0 0 1 13 15v2.5h3V21H8v-3.5h3V15a5 5 0 0 1-3.4-3A4.5 4.5 0 0 1 3.5 7.5V5H7zm0 4H5.5v.5A2.5 2.5 0 0 0 7 9.8zm10 0v2.8a2.5 2.5 0 0 0 1.5-2.3V7z" />
  </S>
)

export const IconChevronRight = (p: P) => (
  <S {...p} strokeWidth={2.4}>
    <path d="m9 5 7 7-7 7" />
  </S>
)

export const IconChevronDown = (p: P) => (
  <S {...p} strokeWidth={2.4}>
    <path d="m5 9 7 7 7-7" />
  </S>
)

export const IconRuler = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <path d="M8 2h8v20H8zm2 3v1.4h3V5zm0 3.5v1.4h4.5V8.5zm0 3.5v1.4h3V12zm0 3.5v1.4h4.5v-1.4zm0 3.5v1.4h3V19z" fillRule="evenodd" />
  </S>
)

export const IconTarget = (p: P) => (
  <S {...p} strokeWidth={2.2}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4" />
  </S>
)

export const IconSort = (p: P) => (
  <S {...p} strokeWidth={2.2}>
    <path d="M8 20V4M4 8l4-4 4 4M16 4v16M12 16l4 4 4-4" />
  </S>
)

export const IconKeyboardHide = (p: P) => (
  <S {...p} strokeWidth={1.6}>
    <rect x="3" y="3.5" width="18" height="11" rx="2" />
    <path d="M6.5 7h.01M9.5 7h.01M12.5 7h.01M15.5 7h.01M17.5 7h.01M6.5 10h.01M17.5 10h.01M9 11h6" strokeWidth={2} />
    <path d="m9.5 18 2.5 2.5 2.5-2.5" strokeWidth={2} />
  </S>
)

export const IconBackspace = (p: P) => (
  <S {...p} strokeWidth={1.8}>
    <path d="M8.5 5H20a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H8.5L2.5 12z" />
    <path d="m11.5 9.5 5 5M16.5 9.5l-5 5" />
  </S>
)

export const IconWarmup = (p: P) => (
  <S {...p} strokeWidth={2.2}>
    <path d="M3 12h6M6 9v6M14 12h7" />
  </S>
)

export const IconReplace = (p: P) => (
  <S {...p} strokeWidth={2.2}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </S>
)

export const IconSuperset = (p: P) => (
  <S {...p} strokeWidth={2.2}>
    <path d="M4 4v16M9 6h11M9 12h11M9 18h11" />
  </S>
)

export const IconX = (p: P) => (
  <S {...p} strokeWidth={2.4}>
    <path d="M5 5l14 14M19 5 5 19" />
  </S>
)

export const IconPencil = (p: P) => (
  <S {...p} strokeWidth={2}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
    <path d="m13.5 6.5 4 4" />
  </S>
)

export const IconCopy = (p: P) => (
  <S {...p} strokeWidth={2}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </S>
)

export const IconTrash = (p: P) => (
  <S {...p} strokeWidth={2}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </S>
)

export const IconTemplate = (p: P) => (
  <S {...p} strokeWidth={2}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </S>
)

export const IconStar = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
  </S>
)

export const IconCamera = (p: P) => (
  <S {...p} strokeWidth={2}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </S>
)

export const IconChart = (p: P) => (
  <S {...p} strokeWidth={2}>
    <path d="M4 4v16h16" />
    <path d="m7 15 4-4 3 3 5-6" />
  </S>
)

export const IconBack = (p: P) => (
  <S {...p} strokeWidth={2.4}>
    <path d="m15 5-7 7 7 7" />
  </S>
)
