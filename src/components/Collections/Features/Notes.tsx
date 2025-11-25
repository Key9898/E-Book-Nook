import { useEffect, useRef, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { auth, db } from '../../../firebaseConfig'

interface NotesProps {
  open?: boolean
  onClose: () => void
  bookId?: string
}

export default function Notes({ open = true, onClose, bookId }: NotesProps) {
  const [pos, setPos] = useState({ x: 40, y: 80 })
  const [size, setSize] = useState({ w: 300, h: 220 })
  const dragRef = useRef<HTMLDivElement | null>(null)
  const resizing = useRef(false)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const [text, setText] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextSave = useRef(false)
  const [user, setUser] = useState<User | null>(null)

  // Auth State Listener
  useEffect(() => {
    if (!auth) return
    const unsubscribe = auth.onAuthStateChanged((u: User | null) => {
      setUser(u)
    })
    return () => unsubscribe()
  }, [])

  // Load Notes
  useEffect(() => {
    if (!bookId) return

    const load = async () => {
      // Use the user state from onAuthStateChanged, or fallback to current auth user if state not yet set but auth ready
      const currentUser = user || auth?.currentUser

      if (currentUser && db) {
        // Firestore
        try {
          const ref = doc(db, 'users', currentUser.uid, 'notes', bookId)
          const snap = await getDoc(ref)
          if (snap.exists()) {
            setText(snap.data().text || '')
          } else {
            setText('')
          }
        } catch (err) {
          console.error('Error loading note:', err)
        }
      } else {
        // LocalStorage
        const saved = localStorage.getItem(`notes_${bookId}`)
        setText(saved || '')
      }
    }
    load()
  }, [bookId, user])

  // Save Notes (Debounced)
  useEffect(() => {
    if (!bookId) return

    if (saveTimer.current) clearTimeout(saveTimer.current)

    saveTimer.current = setTimeout(async () => {
      if (skipNextSave.current) { skipNextSave.current = false; return }
      const currentUser = user || auth?.currentUser

      if (currentUser && db) {
        // Firestore
        try {
          const ref = doc(db, 'users', currentUser.uid, 'notes', bookId)
          if (text) {
            await setDoc(ref, { text }, { merge: true })
          } else {
            await setDoc(ref, { text: '' }, { merge: true })
          }
          try { window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Notes saved' } })) } catch {}
        } catch (err) {
          console.error('Error saving note:', err)
        }
      } else {
        // LocalStorage
        if (text) {
          localStorage.setItem(`notes_${bookId}`, text)
        } else {
          localStorage.removeItem(`notes_${bookId}`)
        }
        try { window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Notes saved' } })) } catch {}
      }
    }, 1000)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [text, bookId, user])


  // Window Drag/Resize Logic
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (dragging.current) {
        const dx = e.clientX - last.current.x
        const dy = e.clientY - last.current.y
        setPos((p) => ({ x: Math.max(0, p.x + dx), y: Math.max(0, p.y + dy) }))
        last.current = { x: e.clientX, y: e.clientY }
      } else if (resizing.current) {
        const dx = e.clientX - last.current.x
        const dy = e.clientY - last.current.y
        setSize((s) => ({ w: Math.max(220, s.w + dx), h: Math.max(160, s.h + dy) }))
        last.current = { x: e.clientX, y: e.clientY }
      }
    }
    const onUp = () => {
      dragging.current = false
      resizing.current = false
      document.body.style.cursor = ''
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  const onDragStart = (e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    last.current = { x: e.clientX, y: e.clientY }
    document.body.style.cursor = 'grabbing'
  }

  const onResizeStart = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizing.current = true
    last.current = { x: e.clientX, y: e.clientY }
  }

  const clearNotes = async () => {
    skipNextSave.current = true
    setText('')
    if (!bookId) return
    const currentUser = user || auth?.currentUser
    if (currentUser && db) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'notes', bookId))
      } catch (err) {
        console.error('Failed to delete note', err)
      }
    } else {
      try { localStorage.removeItem(`notes_${bookId}`) } catch {}
    }
    try { window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Note deleted' } })) } catch {}
  }

  if (!open) return null

  return (
    <div
      ref={dragRef}
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h, touchAction: 'none' }}
      className="absolute z-50 bg-yellow-100 dark:bg-gray-700 dark:text-white shadow-lg rounded-xl ring-1 ring-black/5 overflow-hidden flex flex-col"
    >
      <div
        onPointerDown={onDragStart}
        className="cursor-grab bg-yellow-200 dark:bg-gray-800 px-3 py-2 text-sm font-semibold flex items-center justify-between shrink-0 select-none"
      >
        <span>My Notes</span>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            aria-label="Delete"
            title="Delete"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={clearNotes}
            className="rounded-xl px-2 py-1 text-xs bg-rose-600 text-white hover:bg-rose-500"
          >
            Delete
          </button>
          <button
            type="button"
            aria-label="Close"
            title="Close"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="size-8 rounded-xl bg-white/80 backdrop-blur ring-1 ring-white/30 shadow grid place-items-center hover:bg-white"
          >
            <XMarkIcon aria-hidden className="size-4 text-slate-700" />
          </button>
        </div>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full flex-1 p-3 text-sm bg-transparent outline-none resize-none"
        placeholder="Type your notes here..."
      />
      <div
        onPointerDown={onResizeStart}
        className="absolute right-0 bottom-0 size-4 cursor-nwse-resize z-10"
      />
    </div>
  )
}