import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'

vi.mock('next/image', async () => {
  const reactMod = await import('react')
  const ReactMod = reactMod.default ?? reactMod
  return {
    default: (props: Record<string, unknown>) =>
      ReactMod.createElement('img', {
        src: String(props.src),
        alt: String(props.alt ?? ''),
        'data-priority': props.priority ? 'true' : undefined,
        className: props.className as string | undefined,
      }),
  }
})

import { SectionHeader } from '@/components/shop/section-header'
import { SectionSidebar } from '@/components/shop/section-sidebar'

describe('SectionHeader', () => {
  it('renders banner image, gradient background and readable title overlay', () => {
    const html = renderToStaticMarkup(
      React.createElement(SectionHeader, {
        title: 'Kai Cenat',
        entryCount: 11,
        banner: {
          image: 'https://fortnite-api.com/images/shop/kai.png',
          gradient: ['#f86b71ff', '#ffa9a5ff'],
        },
        priority: true,
      })
    )

    expect(html).toContain('linear-gradient(90deg, #f86b71ff, #ffa9a5ff)')
    expect(html).toContain('src="https://fortnite-api.com/images/shop/kai.png"')
    expect(html).toContain('alt=""')
    expect(html).toContain('data-priority="true"')
    expect(html).toContain('Kai Cenat')
    expect(html).toContain('(11)')
  })

  it('renders solid background without image when banner has only backgroundColor', () => {
    const html = renderToStaticMarkup(
      React.createElement(SectionHeader, {
        title: 'Rambo',
        entryCount: 6,
        banner: { backgroundColor: '#784042ff' },
      })
    )

    expect(html).toContain('background:#784042ff')
    expect(html).not.toContain('<img')
    expect(html).toContain('Rambo')
  })

  it('degrades to the plain text header (identical to legacy) when there is no banner', () => {
    const html = renderToStaticMarkup(
      React.createElement(SectionHeader, { title: 'Otros', entryCount: 3 })
    )

    expect(html).not.toContain('<img')
    expect(html).not.toContain('linear-gradient')
    expect(html).toContain('<h2')
    expect(html).toContain('Otros')
    expect(html).toContain('(3)')
  })

  it('uses neutral gradient when banner only carries an image', () => {
    const html = renderToStaticMarkup(
      React.createElement(SectionHeader, {
        title: 'FNCS',
        entryCount: 5,
        banner: { image: 'https://fortnite-api.com/images/banners/ref/icon.png' },
      })
    )

    expect(html).toContain('src="https://fortnite-api.com/images/banners/ref/icon.png"')
    expect(html).toContain('linear-gradient(90deg, #1f2937, #111827)')
  })
})

describe('SectionSidebar', () => {
  it('shows a thumbnail using the same resolved banner image, text-only otherwise', () => {
    const html = renderToStaticMarkup(
      React.createElement(SectionSidebar, {
        sections: [
          {
            id: 'kai-cenat',
            title: 'Kai Cenat',
            slug: 'kai-cenat',
            thumbUrl: 'https://fortnite-api.com/images/shop/kai.png',
          },
          { id: 'otros', title: 'Otros', slug: 'otros', thumbUrl: null },
        ],
      })
    )

    const kaiThumbCount = (html.match(/images\/shop\/kai\.png/g) ?? []).length
    expect(kaiThumbCount).toBe(1)
    expect(html).toContain('Kai Cenat')
    expect(html).toContain('Otros')

    expect(html).not.toContain('href="#section-otros"')
    expect(html).toContain('Otros')
  })

  it('renders horizontal mobile nav without thumbnails', () => {
    const html = renderToStaticMarkup(
      React.createElement(SectionSidebar, {
        sections: [
          {
            id: 'rambo',
            title: 'Rambo',
            slug: 'rambo',
            thumbUrl: 'https://fortnite-api.com/images/shop/rambo.png',
          },
        ],
      })
    )

    const mobileIdx = html.indexOf('lg:hidden')
    expect(html.slice(mobileIdx)).not.toContain('<img')
  })
})
