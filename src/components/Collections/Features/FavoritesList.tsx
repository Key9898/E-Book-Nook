import { useEffect, useState } from 'react'
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { auth } from '../../../firebaseConfig'

interface FavoriteItem { id: string; title?: string; coverUrl?: string }

interface FavoritesListProps {
  open: boolean
  onClose: () => void
  bookId?: string
}

export default function FavoritesList({ open, onClose }: FavoritesListProps) {
  const [items, setItems] = useState<FavoriteItem[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (!auth) return
    const unsubscribe = auth.onAuthStateChanged((u: User | null) => {
      setUser(u)
      if (open) refresh(u)
    })
    return () => unsubscribe()
  }, [open])

  const refresh = async (currentUser?: any) => {
    const u = currentUser || user || auth?.currentUser
    const uid = u?.uid || localStorage.getItem('auth_user')

    if (uid) {
      try {
        const db = getFirestore()
        const snap = await getDocs(collection(db, 'users', uid, 'favorites'))
        const remote: FavoriteItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        let local: FavoriteItem[] = []
        try { const raw = localStorage.getItem('favorites'); local = raw ? JSON.parse(raw) : [] } catch { }
        const mergedMap = new Map<string, FavoriteItem>()
        for (const i of [...local, ...remote]) mergedMap.set(i.id, i)
        setItems(Array.from(mergedMap.values()))
      } catch {
        try {
          const raw = localStorage.getItem('favorites')
          setItems(raw ? JSON.parse(raw) : [])
        } catch { setItems([]) }
      }
      return
    }
    try {
      const raw = localStorage.getItem('favorites')
      setItems(raw ? JSON.parse(raw) : [])
    } catch { setItems([]) }
  }

  useEffect(() => { if (open) refresh() }, [open, user])

  useEffect(() => {
    const onUpdate = () => { refresh() }
    window.addEventListener('favorites:update', onUpdate as any)
    return () => window.removeEventListener('favorites:update', onUpdate as any)
  }, [user])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'favorites') refresh()
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
        await Promise.all(items.map((i) => deleteDoc(doc(db, 'users', uid, 'favorites', i.id))))
      } catch { }
    }
    try { localStorage.removeItem('favorites') } catch { }
    setItems([])
    try { window.dispatchEvent(new CustomEvent('favorites:update')) } catch { }
    try { window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Deleted all favorites' } })) } catch { }
  }

  const remove = async (id: string) => {
    const removed = items.find((i) => i.id === id)
    const next = items.filter((i) => i.id !== id)
    setItems(next)

    const u = user || auth?.currentUser
    const uid = u?.uid || localStorage.getItem('auth_user')

    if (uid) {
      try {
        const db = getFirestore()
        await deleteDoc(doc(db, 'users', uid, 'favorites', id))
      } catch { }
      try { window.dispatchEvent(new CustomEvent('favorites:update')) } catch { }
      try { window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Removed from favorites', message: removed?.title ?? id } })) } catch { }
      return
    }
    try { localStorage.setItem('favorites', JSON.stringify(next)) } catch { }
    try { window.dispatchEvent(new CustomEvent('favorites:update')) } catch { }
    try { window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Removed from favorites', message: removed?.title ?? id } })) } catch { }
  }

  return (
    <div className={`fixed top-0 right-0 h-screen w-80 max-w-[85vw] transform transition-transform duration-300 z-[60] ${open ? 'translate-x-0' : 'translate-x-full'} bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/5`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-cyan-800/80 dark:text-white">My Favorites List</h3>
        <div className="inline-flex items-center gap-2">
          <button type="button" onClick={handleDeleteAll} className="rounded-xl px-3 py-1.5 text-sm bg-rose-600 text-white hover:bg-rose-500">Delete All</button>
          <button type="button" aria-label="Close" title="Close" onClick={onClose} className="size-10 rounded-xl bg-white/80 backdrop-blur ring-1 ring-white/30 shadow grid place-items-center hover:bg-white">
            <XMarkIcon aria-hidden className="size-5 text-slate-700" />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-60px)]">
        {items.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-300">No favorites yet</div>
        ) : (
          items.map((b, idx) => (
            <div key={b.id} className="flex items-center gap-3 rounded-xl ring-1 ring-black/5 bg-white dark:bg-gray-700 p-3">
              <div className="relative size-12 rounded-xl overflow-hidden bg-slate-100">
                {b.coverUrl ? <img src={b.coverUrl} alt={b.title ?? 'cover'} className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
                {idx === 0 && <span className="absolute -top-2 -right-2 rounded-xl bg-cyan-600 text-white text-[10px] px-2 py-0.5">Latest</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.title ?? b.id}</p>
              </div>
              <button type="button" onClick={() => remove(b.id)} className="rounded-xl px-2 py-1 text-xs bg-rose-600 text-white hover:bg-rose-500">Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}