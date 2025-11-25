import { useEffect, useState } from 'react'
import { auth, db } from '../../../firebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'
import { ListBulletIcon } from '@heroicons/react/24/solid'
import { collectionGroup, query, where, onSnapshot, updateDoc, deleteDoc, doc, increment, getDoc, type Timestamp } from 'firebase/firestore'
import { FaFilePdf } from 'react-icons/fa6'
import { LuFileAudio } from 'react-icons/lu'

type CommentItem = {
  id: string
  text: string
  path: string
  createdAt?: Timestamp
  reviewId: string
}

export default function MyComments() {
  const [uid, setUid] = useState<string>('')
  const [items, setItems] = useState<CommentItem[]>([])
  const [editingId, setEditingId] = useState<string>('')
  const [editingText, setEditingText] = useState('')

  useEffect(() => {
    if (!(auth as any)?.app) return
    try { setUid(auth?.currentUser?.uid || '') } catch {}
    const unsub = onAuthStateChanged(auth!, (u) => setUid(u?.uid || ''))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!db || !uid) return
    const bag: Record<string, CommentItem> = {}
    const qs = [
      query(collectionGroup(db, 'comments'), where('userId', '==', uid)),
      query(collectionGroup(db, 'comments'), where('uid', '==', uid)),
      query(collectionGroup(db, 'comments'), where('authorId', '==', uid)),
    ]
    const unsubs = qs.map((qq) => onSnapshot(qq, (snap) => {
      const list: CommentItem[] = snap.docs.map((d) => {
        const v = d.data() as any
        const rid = (d.ref.parent.parent?.id || '')
        return { id: d.id, text: String(v.text || ''), path: d.ref.path, createdAt: v.createdAt, reviewId: rid }
      })
      list.forEach((it) => { bag[it.id] = it })
      const merged = Object.values(bag)
      merged.sort((a, b) => Number((b?.createdAt?.toMillis?.() ?? 0)) - Number((a?.createdAt?.toMillis?.() ?? 0)))
      setItems(merged)
    }, () => {}))
    return () => { unsubs.forEach((u) => u()) }
  }, [uid])

  const [reviewMeta, setReviewMeta] = useState<Record<string, { bookType?: string }>>({})

  useEffect(() => {
    const load = async () => {
      const ids = Array.from(new Set(items.map((i) => i.reviewId).filter(Boolean)))
      const missing = ids.filter((id) => !(reviewMeta[id]))
      if (!db || missing.length === 0) return
      for (const id of missing) {
        try {
          const snap = await getDoc(doc(db, 'reviews', id))
          if (snap.exists()) {
            const data = snap.data() as any
            setReviewMeta((prev) => ({ ...prev, [id]: { bookType: String(data.bookType || '') } }))
          }
        } catch {}
      }
    }
    load()
  }, [items])

  const docRefFromPath = (p: string) => doc(db!, p)

  const saveEdit = async () => {
    const item = items.find((x) => x.id === editingId)
    if (!db || !item) return
    await updateDoc(docRefFromPath(item.path), { text: editingText, content: editingText })
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, text: editingText } : it)))
    setEditingId('')
  }

  const remove = async (it: CommentItem) => {
    if (!db) return
    const ok = window.confirm('Delete this comment?')
    if (!ok) return
    await deleteDoc(docRefFromPath(it.path))
    try {
      const parts = it.path.split('/')
      const idx = parts.indexOf('reviews')
      const reviewId = idx >= 0 ? parts[idx + 1] : ''
      if (reviewId) await updateDoc(doc(db!, 'reviews', reviewId), { commentCount: increment(-1) })
    } catch {}
    setItems((prev) => prev.filter((x) => x.id !== it.id))
  }

  const ItemCard = ({ it }: { it: CommentItem }) => {
    const bt = String(reviewMeta[it.reviewId]?.bookType || '')
    const baseTitle = bt.replace(/\s*\((PDF|Audiobook)\)\s*$/, '')
    const isPdf = /\(PDF\)$/.test(bt)
    const isAudio = /\(Audiobook\)$/.test(bt)
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {isPdf && <FaFilePdf className="size-4 text-red-600" />}
          {isAudio && <LuFileAudio className="size-4 text-cyan-700/80" />}
          <span>{baseTitle || 'Comment'}</span>
        </div>
        <div className="mt-1 text-sm text-slate-700">{it.text}</div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type='button' onClick={() => { setEditingId(it.id); setEditingText(it.text) }} className="rounded-xl bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-500">Edit</button>
          <button type='button' onClick={() => remove(it)} className="rounded-xl bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500">Delete</button>
        </div>
      </div>
    )
  }

  return (
    <div className="sm:px-4 lg:px-8 pt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">My Comments</h2>
        <ListBulletIcon className="size-6 text-slate-700" />
      </div>

      {items.length === 0 ? (
        <div className="mt-6 text-slate-600">No comments yet.</div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((it) => <ItemCard key={it.id} it={it} />)}
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingId('')} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
              <div className="text-lg font-semibold text-slate-900">Edit Comment</div>
              <div className="mt-3">
                <label htmlFor="edit-comment-text" className="block text-sm font-medium text-slate-700">Comment</label>
                <textarea id="edit-comment-text" title="Comment" placeholder="Update your comment" value={editingText} onChange={(e) => setEditingText(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type='button' onClick={() => setEditingId('')} className="rounded-xl bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-900">Cancel</button>
                <button type='button' onClick={saveEdit} className="rounded-xl bg-cyan-700 px-3 py-1.5 text-sm font-semibold text-white">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
