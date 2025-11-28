import { useEffect, useRef, useState, useMemo } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/20/solid'
import { MdFavoriteBorder, MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md"
import { FaEdit, FaHistory, FaRegBookmark } from "react-icons/fa"
import { getFirestore, doc, setDoc, collection, query, where, orderBy, onSnapshot, type DocumentData } from 'firebase/firestore'
import { loadBookProgress, saveBookProgress, updateBookOnOpen, updateBookOnProgress, updateBookOnComplete, type BookProgress } from '@/lib/utils'
import FavoritesList from './FavoritesList'
import RecentlyViewed from './RecentlyViewed'
import Notes from './Notes'
import { useDarkMode } from './DarkMode'

// Worker Source ကို bundler (Vite) ထဲက ESM worker ကိုသုံးခြင်း
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'

interface PdfReaderProps {
  bookId: string
  fileUrl: string
  title?: string
  coverUrl?: string
  onClose?: () => void
}

export default function PdfReader({ bookId, fileUrl, title, coverUrl, onClose }: PdfReaderProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [initialPage, setInitialPage] = useState<number | null>(null)
  const [openFav, setOpenFav] = useState(false)
  const [openRecent, setOpenRecent] = useState(false)
  const [openNotes, setOpenNotes] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { isDark, toggle } = useDarkMode()
  const saveTimer = useRef<number | null>(null)
  const [reviews, setReviews] = useState<{ id: string; author: string; rating: number; text: string; date: string }[]>([])
  const [jumpValue, setJumpValue] = useState<string>('1')

  const progressRef = useRef<BookProgress>({ totalPages: 0, currentPage: 1 })
  const flushSave = async () => { try { await saveBookProgress(bookId, progressRef.current) } catch { } }
  const [loadingDoc, setLoadingDoc] = useState<boolean>(true)

  useEffect(() => {
    (async () => {
      const loaded = await loadBookProgress(bookId)
      if (loaded && typeof loaded.currentPage === 'number' && loaded.currentPage >= 1) {
        setInitialPage(loaded.currentPage)
        setPage(loaded.currentPage)
        setJumpValue(String(loaded.currentPage))
        progressRef.current = updateBookOnOpen({ totalPages: loaded.totalPages || 0, currentPage: loaded.currentPage, startedTs: loaded.startedTs, completedTs: loaded.completedTs, lastActivityTs: loaded.lastActivityTs })
        await saveBookProgress(bookId, progressRef.current)
      } else {
        setInitialPage(null)
        progressRef.current = updateBookOnOpen(progressRef.current)
        await saveBookProgress(bookId, progressRef.current)
      }
    })()
  }, [bookId])

  useEffect(() => {
    if (!bookId || page < 1) return
    const nextTotal = numPages || progressRef.current.totalPages || 0
    progressRef.current = updateBookOnProgress({ ...progressRef.current, totalPages: nextTotal }, page)
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
    saveTimer.current = window.setTimeout(async () => {
      if (numPages && page >= numPages) {
        progressRef.current = updateBookOnComplete(progressRef.current)
      }
      await saveBookProgress(bookId, progressRef.current)
      saveTimer.current = null
    }, 250)
    return () => {
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
      const total = numPages || progressRef.current.totalPages || 0
      progressRef.current = updateBookOnProgress({ ...progressRef.current, totalPages: total }, page)
      void flushSave()
    }
  }, [page, bookId, numPages])

  useEffect(() => { setJumpValue(String(page)) }, [page])

  const handleBack = () => {
    const total = numPages || progressRef.current.totalPages || 0
    progressRef.current = updateBookOnProgress({ ...progressRef.current, totalPages: total }, page)
    void flushSave()
    if (onClose) onClose(); else if (typeof window !== 'undefined') window.history.back()
  }

  // Screen width ကို ယူမယ့် state (Responsive PDF အတွက်)
  const [pageWidth, setPageWidth] = useState(window.innerWidth < 768 ? window.innerWidth - 40 : 800);

  // Resize + measure container width to keep PDF equal to header width
  useEffect(() => {
    const measure = () => {
      const w = containerRef.current?.offsetWidth ?? (window.innerWidth < 768 ? window.innerWidth - 40 : 800)
      setPageWidth(w)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, []);

  useEffect(() => {
    const syncAndSave = () => {
      const total = numPages || progressRef.current.totalPages || 0
      progressRef.current = updateBookOnProgress({ ...progressRef.current, totalPages: total }, page)
      void flushSave()
    }
    const onVis = () => { if (document.hidden) { syncAndSave() } }
    const onBeforeUnload = () => { syncAndSave() }
    const onPageHide = () => { syncAndSave() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [bookId, page, numPages])

  // Recently Viewed Logic
  useEffect(() => {
    const uid = localStorage.getItem('auth_user')
    const ts = Date.now()
    if (uid) {
      try {
        const db = getFirestore()
        setDoc(doc(db, 'users', uid, 'recentlyViewed', bookId), { id: bookId, title, coverUrl, ts }, { merge: true })
      } catch {
        try {
          const raw = localStorage.getItem('recentlyViewed')
          const list = raw ? JSON.parse(raw) : []
          const next = [{ id: bookId, title, coverUrl, ts }, ...list.filter((i: any) => i.id !== bookId)]
          localStorage.setItem('recentlyViewed', JSON.stringify(next.slice(0, 20)))
        } catch { }
      }
    } else {
      try {
        const raw = localStorage.getItem('recentlyViewed')
        const list = raw ? JSON.parse(raw) : []
        const next = [{ id: bookId, title, coverUrl, ts }, ...list.filter((i: any) => i.id !== bookId)]
        localStorage.setItem('recentlyViewed', JSON.stringify(next.slice(0, 20)))
      } catch { }
    }
    try { window.dispatchEvent(new CustomEvent('recentlyViewed:update')) } catch { }
  }, [bookId, title, coverUrl])

  const pdfKey = useMemo(() => {
    const t = title ?? ''
    if (/^Introduction to Python/i.test(t)) return 'Introduction to Python Programming (PDF)'
    return `${t} (PDF)`
  }, [title])

  useEffect(() => {
    if (!pdfKey) return
    try {
      const db = getFirestore()
      const q = query(collection(db, 'reviews'), where('bookType', '==', pdfKey), orderBy('createdAt', 'desc'))
      const unsub = onSnapshot(q, (snap) => {
        const list: { id: string; author: string; rating: number; text: string; date: string }[] = []
        snap.forEach((d) => {
          const data = d.data() as DocumentData
          list.push({
            id: d.id,
            author: String(data.userName || data.author || ''),
            rating: Number(data.rating) || 0,
            text: String(data.text || data.content || ''),
            date: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : String(data.date || ''),
          })
        })
        setReviews(list)
      })
      return () => unsub()
    } catch { }
  }, [pdfKey])

  const addFavorite = async () => {
    const uid = localStorage.getItem('auth_user')
    if (uid) {
      try {
        const db = getFirestore()
        await setDoc(doc(db, 'users', uid, 'favorites', bookId), { id: bookId, title, coverUrl })
        try { window.dispatchEvent(new CustomEvent('favorites:update')) } catch { }
        try { window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Added to favorites', message: title ?? bookId } })) } catch { }
        setOpenFav(true)
        return
      } catch { }
    }
    try {
      const raw = localStorage.getItem('favorites')
      const list = raw ? JSON.parse(raw) : []
      if (!list.find((i: any) => i.id === bookId)) {
        const next = [{ id: bookId, title, coverUrl }, ...list]
        localStorage.setItem('favorites', JSON.stringify(next))
        try { window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Added to favorites', message: title ?? bookId } })) } catch { }
      } else {
        try { window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Already in favorites', message: title ?? bookId } })) } catch { }
      }
      try { window.dispatchEvent(new CustomEvent('favorites:update')) } catch { }
      setOpenFav(true)
    } catch { }
  }

  return (
    <div className="fixed inset-0 z-[2000] h-screen w-full bg-gray-50 dark:bg-gray-800 flex flex-col overflow-hidden">

      {/* Back Button */}
      <div className="absolute left-5 z-50 top-29 sm:top-28 lg:top-6">
        <button type="button" aria-label="Back" title="Back" onClick={handleBack} className="p-2 bg-white dark:bg-slate-700 rounded-full shadow hover:scale-105">
          <span className="sr-only">Back</span>
          <ChevronLeftIcon aria-hidden className="size-6 text-slate-700 dark:text-white" />
        </button>
      </div>

      {/* Feature Icons Bar (Right Side) */}
      <div className="absolute top-29 sm:top-28 lg:top-20 right-4 z-40 flex flex-col gap-3">
        {/* Add to Favorite (Heart) */}
        <button type="button" onClick={addFavorite} className="p-2 rounded-full bg-white dark:bg-slate-700 shadow-lg hover:scale-110 transition" title="Add to Favorites">
          <MdFavoriteBorder className="size-6 text-rose-500" />
        </button>
        {/* Open Favorites Drawer (Bookmark List) */}
        <button type="button" onClick={() => setOpenFav(true)} className="p-2 rounded-full bg-white dark:bg-slate-700 shadow-lg hover:scale-110 transition" title="My List">
          <FaRegBookmark className="size-5 text-cyan-600 dark:text-cyan-400" />
        </button>
        {/* Toggle Notes */}
        <button type="button" onClick={() => setOpenNotes(!openNotes)} className="p-2 rounded-full bg-white dark:bg-slate-700 shadow-lg hover:scale-110 transition" title="My Notes">
          <FaEdit className="size-5 text-yellow-500" />
        </button>
        {/* Recently Viewed */}
        <button type="button" onClick={() => setOpenRecent(true)} className="p-2 rounded-full bg-white dark:bg-slate-700 shadow-lg hover:scale-110 transition" title="History">
          <FaHistory className="size-5 text-purple-500" />
        </button>
        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggle}
          className="p-2 rounded-full bg-white dark:bg-slate-700 shadow-lg hover:scale-110 transition"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          {isDark ? (
            <MdOutlineLightMode className="size-6 text-yellow-500" />
          ) : (
            <MdOutlineDarkMode className="size-6 text-slate-800" />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full overflow-y-auto p-4 flex flex-col items-center pb-40 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        {/* Header / Controls */}
        <div ref={containerRef} className="w-full max-w-4xl flex items-center justify-between mb-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-xl shadow-sm sticky top-0 z-30">
          <h2 className="font-bold text-slate-700 dark:text-white truncate max-w-[200px]">{title}</h2>

          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Previous page"
              title="Previous page"
              disabled={loadingDoc || page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-50"
            >
              <span className="sr-only">Previous page</span>
              <ChevronLeftIcon aria-hidden className="size-5 dark:text-white" />
            </button>
            <span className="text-sm font-medium dark:text-white">Page</span>
            <label htmlFor="jumpPage" className="sr-only">Jump to page</label>
            <input
              type="text"
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                const v = Number.parseInt(jumpValue, 10)
                if (!Number.isFinite(v)) return
                if (v < 1) return
                const total = numPages || progressRef.current.totalPages || 0
                if (total <= 0) return
                if (v > total) return
                setPage(v)
              }}
              inputMode="numeric"
              id="jumpPage"
              aria-label="Jump to page"
              title="Jump to page"
              placeholder="Page #"
              autoComplete="off"
              className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <span className="text-sm font-medium dark:text-white">
              of {numPages || '--'}
            </span>
            <button
              type="button"
              aria-label="Next page"
              title="Next page"
              disabled={loadingDoc || page >= numPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-50"
            >
              <span className="sr-only">Next page</span>
              <ChevronRightIcon aria-hidden className="size-5 dark:text-white" />
            </button>
          </div>
        </div>

        {/* PDF Document Container */}
        <div className="w-full max-w-4xl shadow-2xl">
          {loadingDoc && (
            <div className="mb-3 h-1 w-full overflow-hidden rounded bg-slate-200">
              <div className="h-1 w-1/3 animate-pulse bg-cyan-600" />
            </div>
          )}
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
              progressRef.current = { ...progressRef.current, totalPages: numPages };
              const target = initialPage != null ? initialPage : page
              const next = Math.min(Math.max(target, 1), numPages)
              setPage(next)
              progressRef.current = updateBookOnProgress(progressRef.current, next)
              setLoadingDoc(false)
            }}
            loading={<div className="text-center py-10 dark:text-white">Loading PDF...</div>}
            error={<div className="text-red-500 py-10">Failed to load PDF!</div>}
          >
            {/* Dynamic Width */}
            <Page
              pageNumber={page}
              width={pageWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="border border-slate-200"
            />
          </Document>
        </div>

        {/* Reviews Section - Moved here for better flow */}
        <div className="w-full max-w-4xl mt-10">
          <div className="flex flex-col rounded-xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Reviews</h3>
            </div>

            <div className="max-h-80 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600">
              {reviews.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-4">No reviews yet</p>
              ) : (
                <ul className="space-y-4">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">{r.author}</span>
                        {r.date ? <span className="text-xs text-slate-500 dark:text-slate-400">{r.date}</span> : null}
                      </div>
                      <div className="mt-1 flex items-center">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <StarIcon key={i} aria-hidden className={(r.rating > i ? 'text-yellow-400' : 'text-slate-300') + ' size-4'} />
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{r.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <FavoritesList bookId={bookId} open={openFav} onClose={() => setOpenFav(false)} />
      <RecentlyViewed bookId={bookId} open={openRecent} onClose={() => setOpenRecent(false)} />

      {/* Note ကို Render လုပ်လိုက်ရင် Absolute position နဲ့ ပြ */}
      {openNotes && (
        <Notes bookId={bookId} onClose={() => setOpenNotes(false)} />
      )}

    </div>
  )
}
