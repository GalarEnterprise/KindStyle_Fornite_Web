import type { ShopDisplayBanner } from '@/lib/services/catalog/display-model'
import type { SpecialProductType } from '@/lib/services/catalog/display-model'

interface SpecialSectionHeaderProps {
  title: string
  entryCount: number
  specialType: SpecialProductType
  banner?: ShopDisplayBanner
  priority?: boolean
}

const SPECIAL_COLORS: Record<SpecialProductType, string> = {
  VBucks: 'from-yellow-600 to-yellow-800',
  BATTLE_PASS: 'from-blue-600 to-blue-800',
  CREW: 'from-purple-600 to-purple-800',
  DLC: 'from-emerald-600 to-emerald-800',
  JAM_TRACK: 'from-pink-600 to-pink-800',
}

const SPECIAL_ICONS: Record<SpecialProductType, string> = {
  VBucks: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  BATTLE_PASS: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  CREW: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  DLC: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  JAM_TRACK: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
}

export function SpecialSectionHeader({
  title,
  entryCount,
  specialType,
  banner,
  priority = false,
}: SpecialSectionHeaderProps) {
  const gradientClass = SPECIAL_COLORS[specialType]
  const iconPath = SPECIAL_ICONS[specialType]

  const background = banner?.gradient
    ? `linear-gradient(90deg, ${banner.gradient[0]}, ${banner.gradient[1]})`
    : banner?.backgroundColor
      ? `linear-gradient(90deg, ${banner.backgroundColor}, ${banner.backgroundColor}dd)`
      : undefined

  return (
    <div
      className={`section-banner relative mb-4 overflow-hidden rounded-lg border border-gray-700 h-24 sm:h-32 bg-gradient-to-r ${gradientClass}`}
      style={background ? { background } : undefined}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      <div className="relative flex h-full items-center gap-3 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow-md flex items-center gap-2">
            {title}
            <span className="text-sm font-normal text-white/80">({entryCount})</span>
          </h2>
          <p className="text-xs text-white/70 mt-0.5">Requiere cuenta de Epic Games</p>
        </div>
      </div>
    </div>
  )
}
