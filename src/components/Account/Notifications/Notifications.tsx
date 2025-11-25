import { useEffect, useState } from 'react'
import { auth, db } from '../../../firebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore'

type NoteItem = { id: string, title: string, message: string, type: 'system' | 'personal', to?: string, read?: boolean, createdAt?: any }

export default function Notifications() {
  const [tab, setTab] = useState<'system' | 'personal'>('personal')
  const [items, setItems] = useState<NoteItem[]>([])
  const [uid, setUid] = useState<string>('')

  useEffect(() => {
    if (!(auth as any)?.app) return
    const unsub = onAuthStateChanged(auth!, (u) => setUid(u?.uid || ''))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!db) return
    const base = collection(db, 'notifications')
    const q = tab === 'system'
      ? query(base, where('type', '==', 'system'))
      : uid
        ? query(base, where('to', '==', uid))
        : null
    if (!q) { setItems([]); return }
    const unsub = onSnapshot(q, (snap) => {
      let list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      let dismissed: string[] = []
      try {
        const raw = localStorage.getItem(`noti:dismiss:${uid || 'anon'}`)
        if (raw) dismissed = JSON.parse(raw)
      } catch {}
      if (tab === 'system') {
        const now = Date.now()
        const maxAgeMs = 7 * 24 * 60 * 60 * 1000
        list = list.filter((n) => {
          const readBy = Array.isArray((n as any).readBy) ? (n as any).readBy as string[] : []
          const perUserUnread = !readBy.includes(uid || '')
          const legacyUnread = !n.read
          const ts = Number((n?.createdAt?.toMillis?.() ?? 0)) || 0
          const fresh = ts > 0 ? (now - ts) <= maxAgeMs : false
          return perUserUnread && legacyUnread && fresh
        })
      } else {
        list = list.filter((n) => !n.read)
      }
      list = list.filter((n) => !dismissed.includes(n.id))
      list.sort((a, b) => Number((b?.createdAt?.toMillis?.() ?? 0)) - Number((a?.createdAt?.toMillis?.() ?? 0)))
      setItems(list)
    }, () => setItems([]))
    return () => unsub()
  }, [tab, uid])

  const markRead = async (id: string) => {
    const dismissLocal = () => {
      try {
        const key = `noti:dismiss:${uid || 'anon'}`
        const raw = localStorage.getItem(key)
        const arr = raw ? JSON.parse(raw) : []
        if (!arr.includes(id)) arr.push(id)
        localStorage.setItem(key, JSON.stringify(arr))
      } catch {}
      setItems((prev) => prev.filter((n) => n.id !== id))
    }
    if (!db) { dismissLocal(); return }
    try {
      if (tab === 'system') {
        if (!uid) { dismissLocal(); return }
        await updateDoc(doc(db, 'notifications', id), { readBy: arrayUnion(uid) })
      } else {
        await updateDoc(doc(db, 'notifications', id), { read: true })
      }
      setItems((prev) => prev.filter((n) => n.id !== id))
    } catch {
      dismissLocal()
    }
  }

  const markAllAsRead = async () => {
    const ids = items.map((n) => n.id)
    const key = `noti:dismiss:${uid || 'anon'}`
    if (!db) {
      try {
        const raw = localStorage.getItem(key)
        const arr = raw ? JSON.parse(raw) : []
        const next = Array.from(new Set([...arr, ...ids]))
        localStorage.setItem(key, JSON.stringify(next))
      } catch {}
      setItems([])
      return
    }
    for (const n of items) {
      try {
        if (tab === 'system') {
          if (!uid) continue
          await updateDoc(doc(db, 'notifications', n.id), { readBy: arrayUnion(uid) })
        } else {
          await updateDoc(doc(db, 'notifications', n.id), { read: true })
        }
      } catch {}
    }
    try {
      const raw = localStorage.getItem(key)
      const arr = raw ? JSON.parse(raw) : []
      const next = Array.from(new Set([...arr, ...ids]))
      localStorage.setItem(key, JSON.stringify(next))
    } catch {}
    setItems([])
  }

  

  return (
    <div className="sm:px-4 lg:px-8 pt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
      <div className="flex items-center gap-2">
        <button type='button' onClick={markAllAsRead} className="rounded-xl bg-cyan-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-600">Mark all as read</button>
        <button type='button' onClick={() => setTab(tab==='personal'?'system':'personal')} className="rounded-xl bg-cyan-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-600">
          {tab === 'personal' ? 'System Notifications' : 'Personal Notifications'}
        </button>
      </div>
      </div>

      <div className="mt-6 space-y-3">
        {items.map((n) => {
          const readBy = Array.isArray((n as any).readBy) ? (n as any).readBy as string[] : []
          const isSystemUnread = (tab === 'system') && (!readBy.includes(uid || '')) && !n.read
          const isUnread = tab === 'system' ? isSystemUnread : !n.read
          return (
            <div
              key={n.id}
              className={`rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between`}
            >
              <div>
                <div className={`text-sm font-semibold text-slate-900`}>{n.title}</div>
                <div className={`mt-1 text-sm text-slate-600`}>{n.message}</div>
              </div>
              <div className="flex items-center gap-2">
                {isUnread && (
                  <button
                    type='button'
                    onClick={() => markRead(n.id)}
                    className="rounded-xl bg-cyan-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-600"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      
    </div>
  )
}
