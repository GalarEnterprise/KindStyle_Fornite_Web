'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useFriendship } from '@/hooks/use-friendship'
import { InfoModal } from '@/components/bots/info-modal'

export function ReadinessBanner() {
  const { panel, isLoading } = useFriendship()
  const [showInfo, setShowInfo] = useState(false)

  if (isLoading || !panel) {
    if (isLoading) return null

    return (
      <>
        <div className="border-b border-purple-500/20 bg-purple-500/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-4 py-2.5 text-sm">
            <span className="text-purple-200">
              Agrega tu ID de plataforma para acelerar tu servicio
            </span>
            <button onClick={() => setShowInfo(true)} className="text-gray-400 hover:text-white" aria-label="Más información">
              [ ? ]
            </button>
            <Link href="/account/bots" className="font-semibold text-purple-300 hover:underline">
              AGREGAR BOTS →
            </Link>
          </div>
        </div>
        {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      </>
    )
  }

  if (panel.status === 'READY') {
    return (
      <div className="border-b border-green-500/20 bg-green-500/10">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-4 py-2.5 text-sm">
          <span className="text-green-400">🟢 Tu cuenta está preparada para gifting</span>
          <Link href="/account/bots" className="font-semibold text-green-300 hover:underline">
            VER MIS BOTS
          </Link>
        </div>
      </div>
    )
  }

  const confirmed = panel.bots.filter((b) => b.friendship_status === 'ACCEPTED').length

  return (
    <div className="border-b border-yellow-500/20 bg-yellow-500/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-4 py-2.5 text-sm">
        <span className="text-yellow-200">
          Tu cuenta está en preparación — {confirmed} de {panel.required_bots} bots confirmados
        </span>
        <Link href="/account/bots" className="font-semibold text-yellow-300 hover:underline">
          VER MIS BOTS
        </Link>
      </div>
    </div>
  )
}
