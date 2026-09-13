'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Section {
  id: string
  title: string
  slug: string
  thumbUrl?: string | null
  cardColor?: string
}

interface SectionSidebarProps {
  sections: Section[]
}

const FALLBACK_DOT_COLOR = '#7DD3FC'

function scrollToSection(slug: string) {
  const el = document.getElementById(`section-${slug}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

export function SectionSidebar({ sections }: SectionSidebarProps) {
  const [activeSection, setActiveSection] = useState<string>('')

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, '', '/shop')
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id.replace('section-', ''))
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    sections.forEach((section) => {
      const element = document.getElementById(`section-${section.slug}`)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [sections])

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:block sticky top-20 w-56 flex-shrink-0">
        <div className="rounded-lg bg-gray-900 border border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Secciones
          </h3>
          <ul className="space-y-1">
            {sections.map((section) => {
              const dotColor = section.cardColor ?? FALLBACK_DOT_COLOR
              const isActive = activeSection === section.slug
              return (
                <li key={section.slug}>
                  <button
                    onClick={() => scrollToSection(section.slug)}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors w-full text-left ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-white"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full ring-1 ring-white/25"
                      style={{ backgroundColor: dotColor }}
                      aria-hidden="true"
                    />
                    {section.thumbUrl && (
                      <Image
                        src={section.thumbUrl}
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 flex-shrink-0 rounded object-cover"
                      />
                    )}
                    {section.title}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile horizontal nav */}
      <nav className="lg:hidden sticky top-16 z-10 bg-gray-950 border-b border-gray-700">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 px-4 py-3">
            {sections.map((section) => {
              const dotColor = section.cardColor ?? FALLBACK_DOT_COLOR
              return (
                <button
                  key={section.slug}
                  onClick={() => scrollToSection(section.slug)}
                  className={`flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    activeSection === section.slug
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full ring-1 ring-white/25"
                    style={{ backgroundColor: dotColor }}
                    aria-hidden="true"
                  />
                  {section.title}
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
