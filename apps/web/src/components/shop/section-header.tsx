import Image from 'next/image'
import type { ShopDisplayBanner } from '@/lib/services/catalog/display-model'
import { withAlpha } from '@/lib/utils/color'

interface SectionHeaderProps {
  title: string
  entryCount: number
  banner?: ShopDisplayBanner
  sectionBgColor?: string
  priority?: boolean
}

export function SectionHeader({ title, entryCount, banner, sectionBgColor, priority = false }: SectionHeaderProps) {
  if (!banner) {
    return (
      <h2
        className="mb-4 rounded-lg px-4 py-3 text-xl font-bold text-white flex items-center gap-2"
        style={sectionBgColor ? { backgroundColor: withAlpha(sectionBgColor, 0.25) } : undefined}
      >
        <span className="h-5 w-1 rounded-full bg-purple-500" />
        {title}
        <span className="text-sm font-normal text-gray-300">({entryCount})</span>
      </h2>
    )
  }

  const background = banner.gradient
    ? `linear-gradient(90deg, ${banner.gradient[0]}, ${banner.gradient[1]})`
    : banner.backgroundColor ?? 'linear-gradient(90deg, #1f2937, #111827)'

  return (
    <div
      className={`section-banner relative mb-4 overflow-hidden rounded-lg border border-gray-700${
        banner.image ? ' h-24 sm:h-32' : ''
      }`}
      style={{ background }}
    >
      {banner.image && (
        <Image
          src={banner.image}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 80vw"
          className="object-cover opacity-70"
          priority={priority}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      <h2 className="relative flex h-full items-center gap-2 px-4 py-3 text-xl font-bold text-white drop-shadow-md">
        <span className="h-5 w-1 rounded-full bg-white/80" />
        {title}
        <span className="text-sm font-normal text-white/80">({entryCount})</span>
      </h2>
    </div>
  )
}
