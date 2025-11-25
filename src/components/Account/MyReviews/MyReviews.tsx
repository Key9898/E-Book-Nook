import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { ListBulletIcon } from '@heroicons/react/24/solid'
import { auth, db } from '../../../firebaseConfig'
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'
import { FaFilePdf } from 'react-icons/fa6'
import { LuFileAudio } from 'react-icons/lu'

type ReviewItem = {
  id: string
  content: string
  rating: number
  country?: string
  bookType?: string
  createdAt?: Timestamp
}

export default function MyReviews() {
  const [uid, setUid] = useState<string>('')
  const [items, setItems] = useState<ReviewItem[]>([])
  const [editingId, setEditingId] = useState<string>('')
  const [editingText, setEditingText] = useState('')
  const [editingRating, setEditingRating] = useState<number>(5)

  useEffect(() => {
    if (!(auth as any)?.app) return
    const unsub = onAuthStateChanged(auth!, (u) => setUid(u?.uid || ''))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!db || !uid) return
    const bag: Record<string, ReviewItem> = {}
    const qs = [
      query(collection(db, 'reviews'), where('userId', '==', uid)),
      query(collection(db, 'reviews'), where('uid', '==', uid)),
      query(collection(db, 'reviews'), where('authorId', '==', uid)),
    ]
    const unsubs = qs.map((qq) => onSnapshot(qq, (snap) => {
      const list: ReviewItem[] = snap.docs.map((d) => {
        const v = d.data() as any
        return { id: d.id, content: String(v.text || v.content || ''), rating: Number(v.rating || 0), country: v.country, bookType: v.bookType, createdAt: v.createdAt }
      })
      list.forEach((it) => { bag[it.id] = it })
      const merged = Object.values(bag)
      merged.sort((a, b) => Number((b?.createdAt?.toMillis?.() ?? 0)) - Number((a?.createdAt?.toMillis?.() ?? 0)))
      setItems(merged)
    }, () => {}))
    return () => { unsubs.forEach((u) => u()) }
  }, [uid])

  const startEdit = (it: ReviewItem) => {
    setEditingId(it.id)
    setEditingText(it.content)
    setEditingRating(it.rating || 5)
  }

  const saveEdit = async () => {
    if (!db || !editingId) return
    await updateDoc(doc(db, 'reviews', editingId), { text: editingText, rating: editingRating })
    setEditingId('')
  }

  const remove = async (id: string) => {
    if (!db) return
    const ok = window.confirm('Delete this review?')
    if (!ok) return
    await deleteDoc(doc(db, 'reviews', id))
  }

  const ItemCard = ({ it }: { it: ReviewItem }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {(() => {
            const bt = String(it.bookType || '')
            const baseTitle = bt.replace(/\s*\((PDF|Audiobook)\)\s*$/, '') || 'Review'
            const isPdf = /\(PDF\)$/.test(bt)
            const isAudio = /\(Audiobook\)$/.test(bt)
            return (
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                {isPdf && <FaFilePdf className="size-4 text-red-600" />}
                {isAudio && <LuFileAudio className="size-4 text-cyan-700/80" />}
                <span>{baseTitle}</span>
              </div>
            )
          })()}
          <div className="mt-1 text-sm text-slate-600">{it.content}</div>
        </div>
        <div className="text-sm font-semibold text-yellow-400">{it.rating}★</div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type='button' onClick={() => startEdit(it)} className="rounded-xl bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-500">Edit</button>
        <button type='button' onClick={() => remove(it.id)} className="rounded-xl bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500">Delete</button>
      </div>
    </div>
  )

  return (
    <div className="sm:px-4 lg:px-8 pt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">My Reviews</h2>
        <ListBulletIcon className="size-6 text-slate-700 pointer-events-none" />
      </div>

      {items.length === 0 ? (
        <div className="mt-6 text-slate-600">No reviews yet.</div>
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
              <div className="text-lg font-semibold text-slate-900">Edit Review</div>
              <div className="mt-3">
                <label htmlFor="edit-review-content" className="block text-sm font-medium text-slate-700">Content</label>
                <textarea id="edit-review-content" title="Review content" placeholder="Update your review" value={editingText} onChange={(e) => setEditingText(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
              </div>
              <div className="mt-3">
                <label htmlFor="edit-review-rating" className="block text-sm font-medium text-slate-700">Rating</label>
                <select id="edit-review-rating" title="Review rating" value={editingRating} onChange={(e) => setEditingRating(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">
                  {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} stars</option>)}
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingId('')} className="rounded-xl bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-900">Cancel</button>
                <button type="button" onClick={saveEdit} className="rounded-xl bg-cyan-700 px-3 py-1.5 text-sm font-semibold text-white">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
