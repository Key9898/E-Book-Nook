import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ListBulletIcon } from '@heroicons/react/24/solid'
import { StarIcon } from '@heroicons/react/20/solid'
import { ChevronDownIcon, FunnelIcon, MinusIcon, PlusIcon, Squares2X2Icon } from '@heroicons/react/20/solid'
import Header from '../../Layouts/Header'
import Footer from '../../Layouts/Footer'
import ScrollToTopButton from '../../Layouts/ScrollUpToTopButton'
import HeroBanner from '../../Layouts/HeroBanner'
import Breadcrumb from '../../Layouts/Breadcrumb'
import { db } from '../../../firebaseConfig'
import { onSnapshot, collection } from 'firebase/firestore'
import PdfPagination from './PdfPagination'
import PdfFiltersSidebar, { defaultFilters } from './PdfFiltersSidebar'
import { FaFilePdf } from 'react-icons/fa6'
import PdfReader from '../Features/PdfReader'

const sortOptions = [
  { name: 'Best Rating', href: '#', current: true },
  { name: 'Latest', href: '#', current: false },
  { name: 'Name: A to Z', href: '#', current: false },
  { name: 'Name: Z to A', href: '#', current: false },
]

const filters = defaultFilters

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

interface PdfBooksProps {
  onNavigate?: (page: string) => void
}

export default function PdfBooks({ onNavigate }: PdfBooksProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 20
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'best' | 'latest' | 'az' | 'za'>('best')
  const [activePdf, setActivePdf] = useState<{ id: string; title: string; cover?: string; fileUrl: string } | null>(null)
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({})
  const [avgRatings, setAvgRatings] = useState<Record<string, number>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem('launchPdf')
      if (raw) {
        const p = JSON.parse(raw)
        setActivePdf({ id: p.id, title: p.title, cover: '', fileUrl: p.url })
        localStorage.removeItem('launchPdf')
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!db) return
    const unsub = onSnapshot(collection(db, 'reviews'), (snap) => {
      const counts: Record<string, number> = {}
      const sums: Record<string, number> = {}
      snap.forEach((d) => {
        const data = d.data() as any
        const bt = String(data?.bookType || '')
        if (!bt) return
        const rating = Number(data?.rating) || 0
        counts[bt] = (counts[bt] ?? 0) + 1
        sums[bt] = (sums[bt] ?? 0) + rating
      })
      const avgs: Record<string, number> = {}
      Object.keys(counts).forEach((bt) => {
        const c = counts[bt] ?? 0
        const s = sums[bt] ?? 0
        const avg = c > 0 ? Number((s / c).toFixed(1)) : 0
        avgs[bt] = Math.max(0, Math.min(5, avg))
      })
      setReviewCounts(counts)
      setAvgRatings(avgs)
    })
    return () => unsub()
  }, [])
  const initSelected = () => {
    const m: Record<string, Set<string>> = {}
    filters.forEach((sec) => {
      const s = sec.options.filter((o) => o.checked).map((o) => o.value)
      if (s.length) m[sec.id] = new Set(s)
    })
    return m
  }
  const [selected, setSelected] = useState<Record<string, Set<string>>>(initSelected())
  const toggleFilter = (sectionId: string, value: string) => {
    setSelected((prev) => {
      const next = { ...prev }
      const set = new Set(next[sectionId] ?? [])
      if (set.has(value)) set.delete(value)
      else set.add(value)
      next[sectionId] = set
      return next
    })
    setCurrentPage(1)
  }
  type BaseBookItem = { id: string; title: string; author: string; language: 'english' | 'myanmar'; tags: string[]; cover: string }
  type BookItem = BaseBookItem & { fileUrl: string }

  const books: BookItem[] = [
    {
      id: 'pdf1',
      title: 'Introduction to Computer Science',
      author: 'Unknown',
      language: 'english',
      tags: ['learningIT'],
      cover: '',
      fileUrl: '/PdfBooks/introduction_to_computer_science.pdf',
    },
    {
      id: 'pdf2',
      title: 'Reading with COC Formula',
      author: 'Unknown',
      language: 'english',
      tags: ['learningEnglish'],
      cover: '',
      fileUrl: '/PdfBooks/reading_with_coc_%20formula.pdf',
    },
    {
      id: 'pdf3',
      title: 'Introduction to Python',
      author: 'Unknown',
      language: 'english',
      tags: ['learningIT'],
      cover: '',
      fileUrl: '/PdfBooks/introduction_to_python_programming.pdf',
    },
    {
      id: 'pdf4',
      title: 'Rockstar Developer 2025',
      author: 'Sayar Ei Maung',
      language: 'myanmar',
      tags: ['learningIT'],
      cover: '',
      fileUrl: '/PdfBooks/rockstar_developer_2025.pdf',
    },
  ]

  const pdfKey = (title: string) => {
    if (/^Introduction to Python/i.test(title)) return 'Introduction to Python Programming (PDF)'
    return `${title} (PDF)`
  }
  const matches = (b: BookItem) => {
    const lang = selected['bookLanguages']
    if (lang && lang.size && !lang.has(b.language)) return false
    const activeKeys = Object.keys(selected).filter((k) => k !== 'bookLanguages' && selected[k]?.size)
    if (activeKeys.length) {
      const ok = activeKeys.some((k) => [...(selected[k] ?? [])].some((v) => b.tags.includes(v)))
      if (!ok) return false
    }
    return true
  }
  const filteredBooks = books.filter(matches)
  const idNum = (id: string) => Number(id.replace(/\D+/g, '')) || 0
  const ratingFor = (b: BookItem) => (avgRatings[pdfKey(b.title)] ?? 0)
  const countFor = (b: BookItem) => (reviewCounts[pdfKey(b.title)] ?? 0)
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'best') {
      const ra = ratingFor(a)
      const rb = ratingFor(b)
      if (rb !== ra) return rb - ra
      const ca = countFor(a)
      const cb = countFor(b)
      if (cb !== ca) return cb - ca
      return a.title.localeCompare(b.title)
    }
    if (sortBy === 'latest') {
      return idNum(b.id) - idNum(a.id)
    }
    if (sortBy === 'az') {
      return a.title.localeCompare(b.title)
    }
    if (sortBy === 'za') {
      return b.title.localeCompare(a.title)
    }
    return 0
  })
  const totalPosts = sortedBooks.length
  const totalPages = Math.max(1, Math.ceil(totalPosts / postsPerPage))
  const startIndex = (currentPage - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  const pagedBooks = sortedBooks.slice(startIndex, endIndex)
  const breadcrumbPages = [
    { name: 'Collections', href: '#collections', current: false },
    { name: 'Pdf Books', href: '#pdfBooks', current: true },
  ]

  return (
    <div className="bg-white">
      <Header onNavigate={onNavigate} />
      <HeroBanner
        onPrimaryAction={() => onNavigate?.('pdfBooks')}
        title="Your Digital Portal to New Worlds"
        description="Welcome to your personal bookshelf. Browse our entire collection of high-quality PDF books. Use the filters to sort by language, genre, or topic and find your next great read."
        buttonText="Browse the Shelf"
        backgroundImgAlt="PDF Books banner"
        preTitleSlot={<Breadcrumb pages={breadcrumbPages} onNavigate={onNavigate} variant="dark" />}
        scrollTargetId="pdfbooks-content"
      />
      <div>
        {/* Mobile filter dialog */}
        <Dialog open={mobileFiltersOpen} onClose={setMobileFiltersOpen} className="relative z-40 lg:hidden">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-closed:opacity-0"
          />

          <div className="fixed inset-0 z-40 flex">
            <DialogPanel
              transition
              className="relative ml-auto flex size-full max-w-xs transform flex-col overflow-y-auto bg-white pt-4 pb-6 shadow-xl transition duration-300 ease-in-out data-closed:translate-x-full"
            >
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="relative -mr-2 flex size-10 items-center justify-center rounded-xl bg-white p-2 text-gray-400 hover:bg-gray-50 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                >
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon aria-hidden="true" className="size-6" />
                </button>
              </div>

              {/* Filters */}
              <form className="mt-4 rounded-xl shadow-xl ring-1 ring-black/5 bg-white border border-gray-200 p-4">
                <h3 className="sr-only">Categories</h3>
                {filters.map((section) => (
                  <Disclosure key={section.id} as="div" className="border-t border-gray-200 px-4 py-6">
                    <h3 className="-mx-2 -my-3 flow-root">
                      <DisclosureButton className="group flex w-full items-center justify-between bg-white px-2 py-3 text-gray-400 hover:text-gray-500">
                        <span className="font-medium text-gray-900">{section.name}</span>
                        <span className="ml-6 flex items-center">
                          <PlusIcon aria-hidden="true" className="size-5 group-data-open:hidden" />
                          <MinusIcon aria-hidden="true" className="size-5 group-not-data-open:hidden" />
                        </span>
                      </DisclosureButton>
                    </h3>
                    <DisclosurePanel className="pt-6">
                      <div className="space-y-6">
                        {section.options.map((option, optionIdx) => (
                          <div key={option.value} className="flex gap-3">
                            <div className="flex h-5 shrink-0 items-center">
                              <div className="group grid size-4 grid-cols-1">
                                <input
                                  id={`filter-mobile-${section.id}-${optionIdx}`}
                                  name={`${section.id}[]`}
                                  type="checkbox"
                                  checked={Boolean(selected[section.id]?.has(option.value))}
                                  onChange={() => toggleFilter(section.id, option.value)}
                                  className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-cyan-600 checked:bg-cyan-600 indeterminate:border-cyan-600 indeterminate:bg-cyan-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                                />
                                <svg
                                  fill="none"
                                  viewBox="0 0 14 14"
                                  className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                                >
                                  <path
                                    d="M3 8L6 11L11 3.5"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="opacity-0 group-has-checked:opacity-100"
                                  />
                                  <path
                                    d="M3 7H11"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="opacity-0 group-has-indeterminate:opacity-100"
                                  />
                                </svg>
                              </div>
                            </div>
                            <label
                              htmlFor={`filter-mobile-${section.id}-${optionIdx}`}
                              className="min-w-0 flex-1 text-gray-500"
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </DisclosurePanel>
                  </Disclosure>
                ))}
              </form>
            </DialogPanel>
          </div>
        </Dialog>

        <main id="pdfbooks-content" className="mx-auto max-w-7xl px-5 sm:px-9 lg:px-8">
          <div className="flex items-baseline justify-between border-b border-gray-200 pt-20 lg:pt-24 pb-6">
            <h1 className="text-4xl font-bold tracking-tight text-cyan-700/80">The Bookshelf</h1>

            <div className="flex items-center">
              <Menu as="div" className="relative inline-block text-left">
                <MenuButton className="group inline-flex justify-center text-sm font-medium text-gray-700 hover:text-gray-900">
                  Sort
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="-mr-1 ml-1 size-5 shrink-0 text-gray-400 group-hover:text-gray-500"
                  />
                </MenuButton>

                <MenuItems
                  transition
                  className="absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                >
                  <div className="py-1">
                    {sortOptions.map((option) => {
                      const key = option.name === 'Best Rating' ? 'best' : option.name === 'Latest' ? 'latest' : option.name === 'Name: A to Z' ? 'az' : 'za'
                      const isCurrent = sortBy === (key as any)
                      return (
                        <MenuItem key={option.name}>
                          <button
                            type="button"
                            onClick={() => { setSortBy(key as any); setCurrentPage(1) }}
                            className={classNames(
                              isCurrent ? 'font-medium text-gray-900' : 'text-gray-500',
                              'block w-full text-left px-4 py-2 text-sm data-focus:bg-gray-100 data-focus:outline-hidden',
                            )}
                          >
                            {option.name}
                          </button>
                        </MenuItem>
                      )
                    })}
                  </div>
                </MenuItems>
              </Menu>

              <button type="button" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="-m-2 ml-5 p-2 text-gray-400 hover:text-gray-500 sm:ml-7">
                <span className="sr-only">{viewMode === 'grid' ? 'View list' : 'View grid'}</span>
                {viewMode === 'grid' ? (
                  <ListBulletIcon aria-hidden="true" className="size-5" />
                ) : (
                  <Squares2X2Icon aria-hidden="true" className="size-5" />
                )}
              </button>
              <button
                type="button"
                className="hidden"
              >
                <span className="sr-only">Filters</span>
                <FunnelIcon aria-hidden="true" className="size-5" />
              </button>
            </div>
          </div>

          <section aria-labelledby="products-heading" className="pt-6 pb-24">
            <h2 id="products-heading" className="sr-only">
              Products
            </h2>

            <div className="lg:hidden mb-6">
              <PdfFiltersSidebar filters={filters} selected={selected} onToggle={toggleFilter} />
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
              {/* Filters */}
              <div className="hidden lg:block">
                <PdfFiltersSidebar filters={filters} selected={selected} onToggle={toggleFilter} />
              </div>

              {/* Product grid */}
              <div className="lg:col-span-3 rounded-xl shadow-xl ring-1 ring-black/5 bg-white p-4">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {pagedBooks.map((b) => (
                      <div key={b.id} className="relative rounded-xl ring-1 ring-black/5 bg-white shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="relative h-40 w-full">
                          {b.cover ? (
                            <img src={b.cover} alt={b.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-100">
                              <FaFilePdf aria-hidden className="size-10 text-slate-500" />
                            </div>
                          )}
                          <span className="absolute top-2 left-2 z-10 rounded-xl px-2 py-1 text-xs font-medium text-white bg-black/10 backdrop-blur-md ring-1 ring-white/30">
                            {b.language}
                          </span>
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="text-base font-semibold text-gray-900">{b.title}</h3>
                          <p className="mt-1 mb-4 text-sm text-gray-500">{b.author}</p>
                          {(reviewCounts[pdfKey(b.title)] ?? 0) > 0 && (
                            <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-xl bg-white/70 backdrop-blur px-2 py-1 text-xs font-medium text-slate-800 ring-1 ring-white/30 shadow-sm">
                              <StarIcon aria-hidden className="size-4 text-yellow-400" />
                              <span>{(avgRatings[pdfKey(b.title)] ?? 0).toFixed(1)}</span>
                              <span className="text-slate-500">({reviewCounts[pdfKey(b.title)]})</span>
                            </div>
                          )}
                          <button type="button" aria-label="Read" title="Read" onClick={() => setActivePdf({ id: b.id, title: b.title, cover: b.cover, fileUrl: b.fileUrl })} disabled={!b.fileUrl} className="pt-2 mt-auto inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-cyan-700 hover:bg-cyan-600">Read Now</button>
                        </div>
                      </div>
                    ))}
                    {pagedBooks.length === 0 && (
                      <div className="col-span-full text-center text-gray-500">No books found</div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pagedBooks.map((b) => (
                      <div key={b.id} className="relative rounded-xl ring-1 ring-black/5 bg-white shadow-sm overflow-hidden flex h-full">
                        <div className="relative h-28 w-28 shrink-0">
                          {b.cover ? (
                            <img src={b.cover} alt={b.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-100">
                              <FaFilePdf aria-hidden className="size-8 text-slate-500" />
                            </div>
                          )}
                          <span className="absolute top-1 left-1 z-10 rounded-xl px-2 py-0.5 text-[10px] font-medium text-white bg-white/20 backdrop-blur-md ring-1 ring-white/30">
                            {b.language}
                          </span>
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="text-base font-semibold text-gray-900">{b.title}</h3>
                          <p className="mt-1 mb-4 text-sm text-gray-500">{b.author}</p>
                          {(reviewCounts[pdfKey(b.title)] ?? 0) > 0 && (
                            <div className="absolute top-1 right-1 inline-flex items-center gap-1 rounded-xl bg-white/70 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-slate-800 ring-1 ring-white/30 shadow-sm">
                              <StarIcon aria-hidden className="size-3.5 text-yellow-400" />
                              <span>{(avgRatings[pdfKey(b.title)] ?? 0).toFixed(1)}</span>
                              <span className="text-slate-500">({reviewCounts[pdfKey(b.title)]})</span>
                            </div>
                          )}
                          <button type="button" aria-label="Read" title="Read" onClick={() => setActivePdf({ id: b.id, title: b.title, cover: b.cover, fileUrl: b.fileUrl })} disabled={!b.fileUrl} className="pt-2 mt-auto inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-cyan-700 hover:bg-cyan-600">Read Now</button>
                        </div>
                      </div>
                    ))}
                    {pagedBooks.length === 0 && (
                      <div className="text-center text-gray-500">No books found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6">
              <PdfPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalPosts={totalPosts} postsPerPage={postsPerPage} />
            </div>
          </section>
        {activePdf && (
          <div className="fixed inset-0 z-[60] bg-white">
            <button type="button" aria-label="Close reading room" title="Close reading room" onClick={() => setActivePdf(null)} className="absolute top-4 left-4 z-[70] rounded-xl bg-cyan-700 px-3 py-1.5 text-sm font-semibold text-white shadow-lg hover:bg-cyan-600">Back</button>
            <PdfReader bookId={activePdf.id} fileUrl={activePdf.fileUrl} title={activePdf.title} coverUrl={activePdf.cover} onClose={() => setActivePdf(null)} />
          </div>
        )}
        </main>
      </div>
      <ScrollToTopButton />
      <Footer onNavigate={onNavigate} />
    </div>
  )
}