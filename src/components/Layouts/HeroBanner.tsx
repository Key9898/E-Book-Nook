import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { FaPhoneVolume } from 'react-icons/fa6'
import { IoIosMail } from 'react-icons/io'
import { FaFacebook, FaYoutube, FaTiktok } from 'react-icons/fa6'
import { useRef } from 'react'
import type { ReactNode } from 'react'

interface ContactItem {
  label: string
  value: string
  href?: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

interface HeroBannerProps {
  onPrimaryAction?: () => void
  title?: string
  description?: string
  buttonText?: string
  backgroundImgAlt?: string
  backgroundImgClass?: string
  variant?: string
  preTitleSlot?: ReactNode
  scrollTargetId?: string
}

export default function HeroBanner({ onPrimaryAction, title, description, buttonText, backgroundImgAlt, backgroundImgClass, variant, preTitleSlot, scrollTargetId }: HeroBannerProps) {
  const contacts: ContactItem[] = [
    {
      label: 'Phone',
      value: '094-301-8336',
      href: 'tel:+15551234567',
      icon: FaPhoneVolume,
    },
    {
      label: 'Email',
      value: 'contact@ebooknook.com',
      href: 'mailto:contact@ebooknook.com',
      icon: IoIosMail,
    },
    {
      label: 'Facebook',
      value: '@ebooknook',
      href: 'https://facebook.com/ebooknook',
      icon: FaFacebook,
    },
    {
      label: 'YouTube',
      value: '@ebooknook',
      href: 'https://youtube.com/@ebooknook',
      icon: FaYoutube,
    },
    {
      label: 'TikTok',
      value: '@ebooknook',
      href: 'https://tiktok.com/@ebooknook',
      icon: FaTiktok,
    },
  ]

  const effectiveTitle = title ?? 'Discover a Deeper Reading Experience'
  const effectiveDescription =
    description ??
    "E-Book Nook is more than just a library. It's a space designed with powerful tools to help you track your progress, capture ideas, and read comfortably. See what makes your nook special."
  const effectiveButton = buttonText ?? 'Explore Features'
  const bgMap: Record<string, string> = {
    collections: "bg-[url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop')]",
    faqs: "bg-[url('https://images.unsplash.com/photo-1517180102446-f3ece52eac50?q=80&w=2000&auto=format&fit=crop')]",
    terms: "bg-[url('https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=2000&auto=format&fit=crop')]",
    privacy: "bg-[url('https://images.unsplash.com/photo-1507840787230-210e4d6fda4d?q=80&w=2000&auto=format&fit=crop')]",
    home: "bg-[url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop')]",
  }
  const effectiveBgClass = backgroundImgClass ?? (variant ? bgMap[variant] : undefined) ?? bgMap.home
  const bgUrlMatch = (effectiveBgClass || '').match(/url\(["']([^"']+)["']\)/)
  const bgUrl = bgUrlMatch ? bgUrlMatch[1] : ''

  const sectionRef = useRef<HTMLElement | null>(null)

  const animateScrollTo = (top: number, duration = 1200) => {
    const start = window.scrollY
    const change = top - start
    const startTime = performance.now()
    const step = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = t * t * t
      window.scrollTo({ top: start + change * eased, behavior: 'auto' })
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  const handlePrimaryAction = () => {
    let target: HTMLElement | null = null
    if (scrollTargetId) target = document.getElementById(scrollTargetId)
    if (!target && sectionRef.current?.nextElementSibling) {
      target = sectionRef.current.nextElementSibling as HTMLElement
    }
    if (target) {
      const header = document.querySelector('header') as HTMLElement | null
      const offset = header?.offsetHeight ?? 0
      const top = target.getBoundingClientRect().top + window.scrollY - offset - 8
      animateScrollTo(top)
      return
    }
    if (onPrimaryAction) {
      onPrimaryAction()
    }
  }

  return (
    <section
      aria-label={backgroundImgAlt ?? effectiveTitle}
      className={`relative isolate bg-cover bg-center bg-no-repeat ${effectiveBgClass}`}
      ref={sectionRef}
    >
      {bgUrl && (
        <img
          src={bgUrl}
          alt={backgroundImgAlt ?? effectiveTitle}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          aria-hidden
          className="hidden"
        />
      )}
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 py-20 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          {preTitleSlot && (
            <div className="mb-6 sm:mb-8 lg:mb-12">
              {preTitleSlot}
            </div>
          )}
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            {effectiveTitle}
          </h1>
          <p className="mt-6 text-lg text-white/80 max-w-2xl">
            {effectiveDescription}
          </p>
          <div className="mt-8">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex items-center rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-cyan-600"
            >
              {effectiveButton}
              <ChevronDownIcon aria-hidden="true" className="mt-2 ml-2 size-6 animate-bounce" />
            </button>
          </div>
        </div>

        <div className="mt-16 h-px w-full bg-white/20" />

        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {contacts.map((item) => (
            <div key={item.label} className="">
              {item.href?.startsWith('http') ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="group">
                  <div className="mb-2 flex items-center gap-3">
                    <item.icon aria-hidden className="size-7 text-cyan-500 group-hover:text-cyan-400" />
                    <h3 className="text-white font-semibold text-lg">{item.label}</h3>
                  </div>
                  <p className="mt-1 text-white/70 text-base">{item.value}</p>
                </a>
              ) : (
                <>
                  <div className="mb-2 flex items-center gap-3">
                    <item.icon aria-hidden={true} className="size-7 text-cyan-500 hover:text-cyan-400" />
                    <h3 className="text-white font-semibold text-lg">{item.label}</h3>
                  </div>
                  <p className="mt-1 text-white/70 text-base">{item.value}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
