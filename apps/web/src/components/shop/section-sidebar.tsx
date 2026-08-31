'use client'

import { useState, useEffect } from 'react'

interface Section {
  id: string
  title: string
  slug: string
}

interface SectionSidebarProps {
  sections: Section[]
}

export function SectionSidebar({ sections }: SectionSidebarProps) {
  const [activeSection, setActiveSection] = useState<string>('')

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
            {sections.map((section) => (
              <li key={section.slug}>
                <a
                  href={`#section-${section.slug}`}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                    activeSection === section.slug
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile horizontal nav */}
      <nav className="lg:hidden sticky top-16 z-10 bg-gray-950 border-b border-gray-700">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 px-4 py-3">
            {sections.map((section) => (
              <a
                key={section.slug}
                href={`#section-${section.slug}`}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  activeSection === section.slug
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </nav>
    </>
  )
}
