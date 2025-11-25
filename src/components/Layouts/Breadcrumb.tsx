import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid'

interface BreadcrumbProps {
  pages: Array<{
    name: string
    href: string
    current: boolean
  }>
  onNavigate?: (page: string) => void
  variant?: 'light' | 'dark'
}

export default function Breadcrumb({ pages, onNavigate, variant = 'light' }: BreadcrumbProps) {
  const handleNavigation = (href: string) => {
    if (onNavigate && href.startsWith('#')) {
      const page = href.substring(1)
      if (page === 'home') {
        try { localStorage.removeItem('header_active_slug') } catch {}
      }
      onNavigate(page)
    }
  }
  const textColors = variant === 'dark' ? {
    homeIcon: 'text-white/70 hover:text-white',
    chevron: 'text-white/50',
    text: 'text-white/80 hover:text-white'
  } : {
    homeIcon: 'text-slate-400 hover:text-slate-500',
    chevron: 'text-slate-400',
    text: 'text-slate-500 hover:text-slate-700'
  }
  return (
    <nav aria-label="Breadcrumb" className="inline-block w-fit rounded-xl px-4 py-2 text-xs text-white bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 transition-all duration-300 sm:text-sm md:text-base backdrop-blur-md shadow-lg hover:shadow-2xl">
      <ol role="list" className="flex items-center space-x-4">
        <li>
          <div>
            <button 
              type="button"
              onClick={() => handleNavigation('#home')} 
              className="focus:outline-none"
            >
              <HomeIcon aria-hidden="true" className={`size-5 shrink-0 ${textColors.homeIcon}`} />
              <span className="sr-only">Home</span>
            </button>
          </div>
        </li>
        {pages.map((page) => (
          <li key={page.name}>
            <div className="flex items-center">
              <ChevronRightIcon aria-hidden="true" className={`size-5 shrink-0 ${textColors.chevron}`} />
              {page.current ? (
                <span
                  aria-current="page"
                  className={`ml-4 text-sm font-medium ${textColors.text.replace(' hover:text-white', '').replace(' hover:text-slate-700', '')} cursor-default`}
                >
                  {page.name}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNavigation(page.href)}
                  className={`ml-4 text-sm font-medium focus:outline-none ${textColors.text}`}
                >
                  {page.name}
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}