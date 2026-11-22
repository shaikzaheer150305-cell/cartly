import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Base({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export const SearchIcon = (props: IconProps) => <Base {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Base>
export const CartIcon = (props: IconProps) => <Base {...props}><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></Base>
export const UserIcon = (props: IconProps) => <Base {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Base>
export const MenuIcon = (props: IconProps) => <Base {...props}><path d="M4 7h16M4 12h16M4 17h16" /></Base>
export const HomeIcon = (props: IconProps) => <Base {...props}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /></Base>
export const BoxIcon = (props: IconProps) => <Base {...props}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></Base>
export const TagIcon = (props: IconProps) => <Base {...props}><path d="M20 13 13 20a2 2 0 0 1-2.8 0L4 14V4h10l6 6a2 2 0 0 1 0 3Z" /><circle cx="8.5" cy="8.5" r="1.5" /></Base>
export const ClipboardIcon = (props: IconProps) => <Base {...props}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h4" /></Base>
export const ChartIcon = (props: IconProps) => <Base {...props}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Base>
export const CheckIcon = (props: IconProps) => <Base {...props}><path d="m5 13 4 4L19 7" /></Base>
export const AlertIcon = (props: IconProps) => <Base {...props}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 2.6 17.4A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z" /></Base>
export const TrashIcon = (props: IconProps) => <Base {...props}><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" /></Base>
export const PencilIcon = (props: IconProps) => <Base {...props}><path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z" /><path d="m14 6 4 4" /></Base>
export const PlusIcon = (props: IconProps) => <Base {...props}><path d="M12 5v14M5 12h14" /></Base>
export const ArrowLeftIcon = (props: IconProps) => <Base {...props}><path d="M19 12H5m7-7-7 7 7 7" /></Base>
export const FilterIcon = (props: IconProps) => <Base {...props}><path d="M4 5h16M7 12h10M10 19h4" /></Base>
export const StarIcon = (props: IconProps) => <Base {...props}><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9 6.6 19.8l1-6.1-4.4-4.3 6.1-.9L12 3Z" /></Base>
export const ArrowRightIcon = (props: IconProps) => <Base {...props}><path d="M5 12h14m-6-6 6 6-6 6" /></Base>
export const TruckIcon = (props: IconProps) => <Base {...props}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></Base>
export const ShieldIcon = (props: IconProps) => <Base {...props}><path d="M12 3 4 6v6c0 5 3.4 8.2 8 9 4.6-.8 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></Base>
export const HeadsetIcon = (props: IconProps) => <Base {...props}><path d="M4 13v-2a8 8 0 0 1 16 0v2" /><path d="M4 13h3v6H5a1 1 0 0 1-1-1v-5Zm16 0h-3v6h2a1 1 0 0 0 1-1v-5Z" /><path d="M19 19c0 2-2 3-5 3" /></Base>
export const BookIcon = (props: IconProps) => <Base {...props}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z" /><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" /></Base>
export const DumbbellIcon = (props: IconProps) => <Base {...props}><path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12" /></Base>
export const ShirtIcon = (props: IconProps) => <Base {...props}><path d="M9 4 5 6 3 10l3 2 1-2v10h10V10l1 2 3-2-2-4-4-2-3 2H9Z" /></Base>
export const SparkIcon = (props: IconProps) => <Base {...props}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></Base>
export const GiftIcon = (props: IconProps) => <Base {...props}><rect x="3" y="9" width="18" height="11" rx="2" /><path d="M3 13h18M12 9v11" /><path d="M12 9S10 4 7.5 4a2.5 2.5 0 0 0 0 5H12Zm0 0s2-5 4.5-5a2.5 2.5 0 0 1 0 5H12Z" /></Base>
export const HeartIcon = (props: IconProps) => <Base {...props}><path d="M20.8 8.6c0 5.2-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.6A4.6 4.6 0 0 1 12 6.3a4.6 4.6 0 0 1 8.8 2.3Z" /></Base>
export const CloseIcon = (props: IconProps) => <Base {...props}><path d="m6 6 12 12M18 6 6 18" /></Base>
