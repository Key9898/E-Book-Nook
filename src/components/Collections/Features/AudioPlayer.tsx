import { useEffect, useState, useMemo, useRef } from 'react'
import { MdFavoriteBorder, MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md"
import { FaEdit, FaHistory, FaRegBookmark } from "react-icons/fa"
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getFirestore, doc, setDoc, collection, query, where, orderBy, onSnapshot, type DocumentData } from 'firebase/firestore'
import { StarIcon } from '@heroicons/react/20/solid'
import { loadAudioProgress, saveAudioProgress, updateAudioOnOpen, updateAudioOnProgress, updateAudioOnComplete, type AudioProgress } from '@/lib/utils'
import FavoritesList from './FavoritesList'
import RecentlyViewed from './RecentlyViewed'
import Notes from './Notes'
import { useDarkMode } from './DarkMode'

interface AudioPlayerProps {
  bookId: string
  audioUrl: string
  title?: string
  coverUrl?: string
  onClose?: () => void
}

export default function AudioPlayer({ bookId, audioUrl, title, coverUrl, onClose }: AudioPlayerProps) {
  const [openFav, setOpenFav] = useState(false)
  const [openRecent, setOpenRecent] = useState(false)
  const [openNotes, setOpenNotes] = useState(false)
  const { isDark, toggle } = useDarkMode()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const saveTimer = useRef<number | null>(null)
  const progressRef = useRef<AudioProgress>({ durationMs: 0, positionMs: 0, playing: false })
  const [reviews, setReviews] = useState<{ id: string; author: string; rating: number; text: string; date: string }[]>([])

  const handleBack = () => { if (onClose) onClose(); else if (typeof window !== 'undefined') window.history.back() }

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

  const audioKey = useMemo(() => {
    const u = audioUrl ?? ''
    if (u.includes('/cocoa_break_collection/')) return 'Cocoa Break Collection (Audiobook)'
    return 'Six Little Girls (Audiobook)'
  }, [audioUrl])

  useEffect(() => {
    (async () => {
      const loaded = await loadAudioProgress(bookId)
      progressRef.current = updateAudioOnOpen(loaded ?? progressRef.current)
      try { await saveAudioProgress(bookId, progressRef.current) } catch { }
      if (loaded && audioRef.current && typeof loaded.positionMs === 'number') {
        try { audioRef.current.currentTime = Math.max(0, loaded.positionMs / 1000) } catch { }
      }
    })()
  }, [bookId])

  const handleTimeUpdate = () => {
    const a = audioRef.current
    if (!a) return
    const posMs = Math.floor(a.currentTime * 1000)
    const durMs = Math.floor((a.duration || 0) * 1000)
    progressRef.current = updateAudioOnProgress({ ...progressRef.current, durationMs: durMs }, posMs, !a.paused)
    if (durMs > 0 && posMs >= durMs * 0.9) progressRef.current = updateAudioOnComplete(progressRef.current)
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
    saveTimer.current = window.setTimeout(() => { (async () => { try { await saveAudioProgress(bookId, progressRef.current) } catch { } finally { saveTimer.current = null } })() }, 500)
  }

  const handleLoadedMetadata = () => {
    const a = audioRef.current
    if (!a) return
    const durMs = Math.floor((a.duration || 0) * 1000)
    progressRef.current = { ...progressRef.current, durationMs: durMs }
  }

  useEffect(() => () => { if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null } }, [])

  useEffect(() => {
    if (!audioKey) return
    try {
      const db = getFirestore()
      const q = query(collection(db, 'reviews'), where('bookType', '==', audioKey), orderBy('createdAt', 'desc'))
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
  }, [audioKey])

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
    <div className="fixed inset-0 z-[2000] h-screen w-screen bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center overflow-hidden">

      {/* Back Button */}
      <div className="absolute left-5 z-50 top-29 sm:top-28 lg:top-8">
        <button type="button" aria-label="Back" title="Back" onClick={handleBack} className="p-2 bg-white dark:bg-slate-700 rounded-full shadow hover:scale-105">
          <span className="sr-only">Back</span>
          <ChevronLeftIcon aria-hidden className="size-6 text-slate-700 dark:text-white" />
        </button>
      </div>

      {/* Feature Icons Bar (Right Side) */}
      <div className="w-full mb-4 flex flex-row justify-center gap-3 lg:absolute lg:top-70 lg:right-170 lg:w-auto lg:mb-0 lg:flex-col">
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

      {/* Main Player Card */}
      <div className="w-full max-w-md px-4">
        <div className="rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white dark:bg-slate-900 overflow-hidden">

          {/* Title & Cover */}
          <div className="flex flex-col items-center p-6 gap-4 text-center">
            <div className="size-48 rounded-xl overflow-hidden shadow-lg ring-1 ring-black/10">
              {coverUrl ? (
                <img src={coverUrl} alt={title ?? 'cover'} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-slate-200 dark:bg-slate-700 grid place-items-center">
                  <span className="text-4xl">🎧</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate">{title ?? 'Audio Player'}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">Enjoy your audiobook</p>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="bg-slate-100 dark:bg-slate-800 p-4">
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              preload="metadata"
              controlsList="nodownload"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handleTimeUpdate}
              onPause={handleTimeUpdate}
              className="w-full h-12 rounded-xl focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="w-full max-w-md px-4 mt-4">
        <div className="rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Reviews</h3>
            <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 pr-1">
              {reviews.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">No reviews yet</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{r.author}</span>
                        {r.date ? <span className="text-xs text-slate-500 dark:text-slate-400">{r.date}</span> : null}
                      </div>
                      <div className="mt-1 flex items-center">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <StarIcon key={i} aria-hidden className={(r.rating > i ? 'text-yellow-400' : 'text-slate-300') + ' size-4'} />
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{r.text}</p>
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

      {openNotes && (
        <Notes bookId={bookId} onClose={() => setOpenNotes(false)} />
      )}
    </div>
  )
}
