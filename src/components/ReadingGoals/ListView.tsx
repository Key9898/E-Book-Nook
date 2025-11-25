import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth, db } from '../../firebaseConfig'
import { collection, getDocs, addDoc, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore'
import GoalsForm from './GoalsForm'
import { RiMindMap } from 'react-icons/ri'

type GoalItem = { id?: string; name: string; target: number; deadlineTs?: number; unit: 'PdfBooks' | 'AudioBooks' }

 

export default function ListView({ onSwitchToMap }: { onSwitchToMap?: () => void }) {
  const [user, setUser] = useState<User | null>(auth?.currentUser || null)
  const [goals, setGoals] = useState<GoalItem[]>([])
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<GoalItem | null>(null)
  const [pdfCompleted, setPdfCompleted] = useState(0)
  const [audioCompleted, setAudioCompleted] = useState(0)

  useEffect(() => {
    if (!(auth as any)?.app) return
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    (async () => {
      const uid = user?.uid || localStorage.getItem('auth_user') || ''
      const list: GoalItem[] = []
      if (uid && db) {
        try {
          const snap = await getDocs(collection(db, 'users', uid, 'readingGoals'))
          snap.docs.forEach((d) => {
            const v = d.data() as any
            if (d.id !== 'current') list.push({ id: d.id, name: String(v.name || v.goalName || ''), target: Number(v.target || v.targetAmount || 0), deadlineTs: v.deadlineTs ? Number(v.deadlineTs) : undefined, unit: (String(v.unit || 'PdfBooks') as any) })
          })
        } catch {}
      } else {
        try {
          const raw = localStorage.getItem('readingGoals')
          const arr = raw ? JSON.parse(raw) : []
          if (Array.isArray(arr)) arr.forEach((v: any, idx: number) => list.push({ id: v.id || String(idx+1), name: String(v.name || v.goalName || ''), target: Number(v.target || v.targetAmount || 0), deadlineTs: v.deadlineTs ? Number(v.deadlineTs) : undefined, unit: (String(v.unit || 'PdfBooks') as any) }))
        } catch {}
      }
      setGoals(list)
    })()
  }, [user?.uid, openForm])

  useEffect(() => {
    (async () => {
      const uid = user?.uid || localStorage.getItem('auth_user') || ''
      let pc = 0, ac = 0
      if (uid && db) {
        try {
          const rp = await getDocs(collection(db, 'users', uid, 'readingProgress'))
          pc = rp.docs.filter((d) => Number((d.data() as any)?.completedTs || 0) > 0).length
        } catch {}
        try {
          const ap = await getDocs(collection(db, 'users', uid, 'audioProgress'))
          ac = ap.docs.filter((d) => Number((d.data() as any)?.completedTs || 0) > 0).length
        } catch {}
      } else {
        try {
          for (let k = 0; k < localStorage.length; k++) {
            const key = localStorage.key(k) || ''
            if (key.startsWith('readingProgress:')) { const raw = localStorage.getItem(key); const v = raw ? JSON.parse(raw) : null; if (Number(v?.completedTs || 0) > 0) pc += 1 }
            if (key.startsWith('audioProgress:')) { const raw = localStorage.getItem(key); const v = raw ? JSON.parse(raw) : null; if (Number(v?.completedTs || 0) > 0) ac += 1 }
          }
        } catch {}
      }
      setPdfCompleted(pc)
      setAudioCompleted(ac)
    })()
  }, [user?.uid])

  const handleSaved = (next: GoalItem) => {
    (async () => {
      const uid = user?.uid || localStorage.getItem('auth_user') || ''
      if (uid && db) {
      try {
        if (editing && editing.id) {
          await setDoc(doc(db, 'users', uid, 'readingGoals', editing.id), { name: next.name, target: next.target, deadlineTs: next.deadlineTs, unit: next.unit, updatedAt: serverTimestamp() }, { merge: true })
        } else {
          await addDoc(collection(db, 'users', uid, 'readingGoals'), { name: next.name, target: next.target, deadlineTs: next.deadlineTs, unit: next.unit, createdAt: serverTimestamp() })
        }
      } catch {}
      } else {
        try {
          const raw = localStorage.getItem('readingGoals')
          const arr: any[] = raw ? JSON.parse(raw) : []
          if (editing) {
            const idx = arr.findIndex((g) => g.id === editing.id)
            if (idx >= 0) arr[idx] = { ...arr[idx], name: next.name, target: next.target, deadlineTs: next.deadlineTs, unit: next.unit }
          } else {
            arr.push({ id: String(Date.now()), name: next.name, target: next.target, deadlineTs: next.deadlineTs, unit: next.unit })
          }
          localStorage.setItem('readingGoals', JSON.stringify(arr))
        } catch {}
      }
      setOpenForm(false)
      setEditing(null)
    })()
  }

  const handleDelete = (g: GoalItem) => {
    (async () => {
      const uid = user?.uid || localStorage.getItem('auth_user') || ''
      if (uid && db && g.id) {
        try { await deleteDoc(doc(db, 'users', uid, 'readingGoals', g.id)) } catch {}
        setGoals((prev) => prev.filter((x) => x.id !== g.id))
      } else {
        try {
          const raw = localStorage.getItem('readingGoals')
          const arr: any[] = raw ? JSON.parse(raw) : []
          const next = arr.filter((x) => x.id !== g.id)
          localStorage.setItem('readingGoals', JSON.stringify(next))
          setGoals((prev) => prev.filter((x) => x.id !== g.id))
        } catch {}
      }
    })()
  }

  return (
    <div className="px-5 sm:px-9 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex-auto">
          <h1 className="text-base font-semibold text-gray-900">Goals List</h1>
        </div>
        <div className="flex-none flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setEditing(null); setOpenForm(true) }}
            className="rounded-md bg-cyan-700 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-cyan-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
            title="Add Goals"
          >
            Add Goals
          </button>
          <button
            type="button"
            onClick={onSwitchToMap}
            className="p-2 rounded-lg bg-slate-200 text-slate-800"
            aria-label="Map View"
            title="Map View"
          >
            <RiMindMap className="size-5" />
          </button>
        </div>
      </div>

      {openForm && (
        <div className="mt-6 rounded-xl ring-1 ring-black/5 bg-white p-4">
          <GoalsForm initialGoal={editing || undefined} onCancel={() => { setOpenForm(false); setEditing(null) }} onSaved={handleSaved} />
        </div>
      )}

      <div className="-mx-4 mt-6 mb-4 ring-1 ring-gray-300 sm:mx-0 sm:rounded-lg">
        <table className="relative min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th scope="col" className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6">Goal Name</th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">Target</th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">Deadline</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Progress</th>
              <th scope="col" className="py-3.5 pr-4 pl-3 sm:pr-6 text-right align-top">Action</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((g, idx) => {
              const done = g.unit === 'AudioBooks' ? audioCompleted : pdfCompleted
              const v = Math.min(g.target || 0, done)
              const pct = g.target ? Math.round((v / g.target) * 100) : 0
              const dstr = g.deadlineTs ? new Date(g.deadlineTs).toLocaleDateString() : '-'
              return (
                <tr key={g.id || String(idx)}>
                  <td className={(idx === 0 ? '' : 'border-t border-transparent') + ' relative py-4 pr-3 pl-4 text-sm sm:pl-6'}>
                    <div className="font-medium text-gray-900">{g.name || '-'}</div>
                    <div className="mt-1 text-gray-500 lg:hidden">Target: {g.target} • Deadline: {dstr}</div>
                    {idx !== 0 ? <div className="absolute -top-px right-0 left-6 h-px bg-gray-200" /> : null}
                  </td>
                  <td className={(idx === 0 ? '' : 'border-t border-gray-200') + ' hidden px-3 py-3.5 text-sm text-gray-500 lg:table-cell'}>{g.target}</td>
                  <td className={(idx === 0 ? '' : 'border-t border-gray-200') + ' hidden px-3 py-3.5 text-sm text-gray-500 lg:table-cell'}>{dstr}</td>
                  <td className={(idx === 0 ? '' : 'border-t border-gray-200') + ' px-3 py-3.5 text-sm text-gray-700 align-top'}>
                    <span>{pct}% ({v}/{g.target})</span>
                  </td>
                  <td className={(idx === 0 ? '' : 'border-t border-transparent') + ' relative py-3.5 pr-4 pl-3 text-right text-sm font-medium sm:pr-6 align-top'}>
                    <div className="inline-flex items-center justify-end gap-2">
                      <button type="button" onClick={() => { setEditing(g); setOpenForm(true) }} className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50">Edit</button>
                      <button type="button" onClick={() => handleDelete(g)} className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-rose-700 shadow-xs inset-ring inset-ring-gray-300 hover:bg-rose-50">Delete</button>
                    </div>
                    {idx !== 0 ? <div className="absolute -top-px right-6 left-0 h-px bg-gray-200" /> : null}
                  </td>
                </tr>
              )
            })}
            {goals.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-gray-500">No goals yet. Add Goals to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
