import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { auth } from '../../../firebaseConfig'

interface ViewedItem { id: string; title?: string; coverUrl?: string; ts?: number }

interface RecentlyViewedProps {
  open: boolean
  onClose: () => void
  bookId?: string
}

export default function RecentlyViewed({ open, onClose }: RecentlyViewedProps) {
  const [items, setItems] = useState<ViewedItem[]>([])
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!auth) return
    const unsubscribe = auth.onAuthStateChanged((u: User | null) => {
      setUser(u)
      if (open) refresh(u)
    })
    return () => unsubscribe()
  }, [open])

  const refresh = async (currentUser?: User | null) => {
    const u = currentUser || user || auth?.currentUser
    const uid = u?.uid || localStorage.getItem('auth_user')

    if (uid) {
      try {
        const db = getFirestore()
        const snap = await getDocs(collection(db, 'users', uid, 'recentlyViewed'))
        const remote: ViewedItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        let local: ViewedItem[] = []
        try { const raw = localStorage.getItem('recentlyViewed'); local = raw ? JSON.parse(raw) : [] } catch { }
        const mergedMap = new Map<string, ViewedItem>()
        for (const i of [...local, ...remote]) mergedMap.set(i.id, i)
        const merged = Array.from(mergedMap.values()).sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
        setItems(merged)
      } catch {
        try {
          const raw = localStorage.getItem('recentlyViewed')
          const list: ViewedItem[] = raw ? JSON.parse(raw) : []
          setItems(list.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0)))
        } catch { setItems([]) }
      }
      return
    }
    try {
      const raw = localStorage.getItem('recentlyViewed')
      const list: ViewedItem[] = raw ? JSON.parse(raw) : []
      setItems(list.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0)))
    } catch { setItems([]) }
  }

  useEffect(() => { if (open) refresh() }, [open, user])

  useEffect(() => {
    const onUpdate = () => { refresh() }
    window.addEventListener('recentlyViewed:update', onUpdate as any)
    return () => window.removeEventListener('recentlyViewed:update', onUpdate as any)
  }, [user])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'recentlyViewed') refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [user])

  const handleDeleteAll = async () => {
    const u = user || auth?.currentUser
    const uid = u?.uid || localStorage.getItem('auth_user')

    if (uid) {
      try {
        const db = getFirestore()
        await Promise.all(items.map((i) => deleteDoc(doc(db, 'users', uid, 'recentlyViewed', i.id))))
      } catch { }
    }
    try { localStorage.removeItem('recentlyViewed') } catch { }
    setItems([])
    try { window.dispatchEvent(new CustomEvent('recentlyViewed:update')) } catch { }
    try { window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Cleared recently viewed' } })) } catch { }
  }

  return (
    <div className={`fixed top-0 right-0 h-screen w-80 max-w-[85vw] transform transition-transform duration-300 z-[60] ${open ? 'translate-x-0' : 'translate-x-full'} bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/5`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-cyan-800/80 dark:text-white">Recently Viewed</h3>
        <div className="inline-flex items-center gap-2">
          <button type="button" onClick={handleDeleteAll} className="rounded-xl px-3 py-1.5 text-sm bg-rose-600 text-white hover:bg-rose-500">Delete All</button>
          <button type="button" aria-label="Close" title="Close" onClick={onClose} className="size-10 rounded-xl bg-white/80 backdrop-blur ring-1 ring-white/30 shadow grid place-items-center hover:bg-white">
            <XMarkIcon aria-hidden className="size-5 text-slate-700" />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-60px)]">
        {items.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-300">No recently viewed items</div>
        ) : (
          items.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-xl ring-1 ring-black/5 bg-white dark:bg-gray-700 p-3">
              <div className="relative size-12 rounded-xl overflow-hidden bg-slate-100">
                {b.coverUrl ? <img src={b.coverUrl} alt={b.title ?? 'cover'} className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.title ?? b.id}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}