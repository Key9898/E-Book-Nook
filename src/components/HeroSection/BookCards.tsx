import { FaFilePdf } from "react-icons/fa6"
import { LuFileAudio } from "react-icons/lu"
import RingAnimation from "./RingAnimation"

const leftTestimonial = {
  title: 'PDF Books',
  icon: FaFilePdf,
}

const rightTestimonial = {
  title: 'Audiobooks',
  icon: LuFileAudio,
}

interface BookCardsProps {
    onNavigate?: (page: string) => void
}

export default function BookCards({ onNavigate }: BookCardsProps) { void onNavigate
  return (
    <div className="relative isolate">
      {/* RingAnimation styles inject */}
      <RingAnimation />
      {/* Section header */}
      <div className="mx-auto max-w-7xl sm:px-8 sm:pb-16 lg:px-8 lg:pb-16">
        {/* Two-card layout: mobile hidden, visible from sm↑ */}
        <div className="mx-auto mt-12 hidden sm:grid max-w-6xl grid-cols-2 place-items-center gap-16 text-slate-900">
          {/* Left: Testimonial */}
          <figure className="lg:mb-43 group relative overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-900/10 transition-transform duration-200 hover:-translate-y-0.5 hover:rotate-[0.5deg] hover:shadow-xl w-[clamp(220px,38vw,320px)] h-[clamp(240px,38vw,340px)]">
            {/* book spine */}
            <div className="absolute left-0 top-0 h-full w-3 bg-gradient-to-b from-slate-300 to-slate-200 shadow-inner z-0" />
            {/* cover gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-white z-0" />
            {/* page edge */}
            <div className="absolute left-0 top-0 bottom-0 w-3 rounded-l-lg bg-gradient-to-b from-slate-200 to-white ring-1 ring-slate-300 shadow-inner z-0" />
            <div className="absolute right-0 top-1 bottom-1 w-2 rounded-r-lg bg-slate-50 border-l border-slate-200 shadow-inner z-0" />
            {/* emblem (icon + title) */}
            <figcaption className="animated-cyan-ring absolute z-[5] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center size-27 rounded-xl shadow-lg bg-white/90">
              <leftTestimonial.icon className="size-20 text-cyan-700/80" aria-hidden="true" />
            </figcaption>
            <figcaption className="relative z-10 mt-4 text-2xl font-semibold text-cyan-700/80 text-center">
              {leftTestimonial.title}
            </figcaption>
          </figure>

          {/* Right: Testimonial */}
          <figure className="group relative overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-900/10 transition-transform duration-200 hover:-translate-y-0.5 hover:rotate-[0.5deg] hover:shadow-xl w-[clamp(220px,38vw,320px)] h-[clamp(240px,38vw,340px)]">
            {/* book spine */}
            <div className="absolute left-0 top-0 h-full w-3 bg-gradient-to-b from-slate-300 to-slate-200 shadow-inner z-0" />
            {/* cover gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-white z-0" />
            {/* page edge */}
            <div className="absolute left-0 top-0 bottom-0 w-3 rounded-l-lg bg-gradient-to-b from-slate-200 to-white ring-1 ring-slate-300 shadow-inner z-0" />
            <div className="absolute right-0 top-1 bottom-1 w-2 rounded-r-lg bg-slate-50 border-l border-slate-200 shadow-inner z-0" />
            {/* emblem (icon + title) */}
            <figcaption className="animated-cyan-ring absolute z-[5] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center size-27 rounded-xl shadow-lg bg-white/90">
              <rightTestimonial.icon className="size-20 text-cyan-700/80" aria-hidden="true" />
            </figcaption>
            <figcaption className="relative z-10 mt-4 text-2xl font-semibold text-cyan-700/80 text-center">
              {rightTestimonial.title}
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  )
}