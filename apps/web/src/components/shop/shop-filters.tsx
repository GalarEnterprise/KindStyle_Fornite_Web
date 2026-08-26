'use client'

interface ShopFiltersProps {
  selectedType: string
  selectedRarity: string
  onTypeChange: (type: string) => void
  onRarityChange: (rarity: string) => void
}

const PRODUCT_TYPES = [
  { value: '', label: 'Todos los tipos' },
  { value: 'OUTFIT', label: 'Outfits' },
  { value: 'BACK_BLING', label: 'Back Bling' },
  { value: 'PICKAXE', label: 'Picos' },
  { value: 'GLIDER', label: 'Planeadores' },
  { value: 'EMOTE', label: 'Emotes' },
  { value: 'WRAP', label: 'Wraps' },
  { value: 'MUSIC_PACK', label: 'Music Packs' },
  { value: 'CONTRAIL', label: 'Contrails' },
  { value: 'SPRAY', label: 'Sprays' },
  { value: 'LOADING_SCREEN', label: 'Loading Screens' },
]

const RARITIES = [
  { value: '', label: 'Todas las rarezas' },
  { value: 'COMMON', label: 'Común' },
  { value: 'UNCOMMON', label: 'Poco común' },
  { value: 'RARE', label: 'Raro' },
  { value: 'EPIC', label: 'Épico' },
  { value: 'LEGENDARY', label: 'Legendario' },
  { value: 'MYTHIC', label: 'Mítico' },
  { value: 'EXOTIC', label: 'Exótico' },
  { value: 'ICON_SERIES', label: 'Icon Series' },
]

export function ShopFilters({
  selectedType,
  selectedRarity,
  onTypeChange,
  onRarityChange,
}: ShopFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={selectedType}
        onChange={(e) => onTypeChange(e.target.value)}
        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
      >
        {PRODUCT_TYPES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={selectedRarity}
        onChange={(e) => onRarityChange(e.target.value)}
        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
      >
        {RARITIES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
