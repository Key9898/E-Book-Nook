import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth, db } from '../../../firebaseConfig'
import { collection, getDocs, doc, setDoc, getDoc, onSnapshot, deleteDoc } from 'firebase/firestore'
import { Calendar } from '@/components/ui/calendar'
import { ChartLineMultiple } from './Charts/LineChart'
import { ChartBarDefault } from './Charts/BarChart'
import { ChartPieDonutText } from './Charts/PieChart'
import { ChartTooltipLabelFormatter } from './Charts/Tooltip'

function formatHoursMinutes(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}h ${m}m`
}

function startOfDay(ts: number) {
  const d = new Date(ts)
  d.setHours(0,0,0,0)
  return d.getTime()
}

export default function MyActivity() {
  const [user, setUser] = useState<User | null>(auth?.currentUser || null)
  const [loading, setLoading] = useState(true)
  const [totalFinished, setTotalFinished] = useState(0)
  const [monthDelta, setMonthDelta] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [weekMinutes, setWeekMinutes] = useState(0)
  const [streak, setStreak] = useState(0)
  const [goalTarget, setGoalTarget] = useState(0)
  const [goalCompleted, setGoalCompleted] = useState(0)
  const [goalUnitLabel, setGoalUnitLabel] = useState<'Books' | 'Audiobooks' | 'Items'>('Books')
  const [lineData, setLineData] = useState<{ month: string; pdf: number; audio: number }[]>([])
  const [barData, setBarData] = useState<{ month: string; total: number }[]>([])
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([])
  const [weekData, setWeekData] = useState<{ date: string; reading: number; audio: number }[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [noteText, setNoteText] = useState('')

  const weekDeltaLabel = useMemo(() => `${Math.floor(weekMinutes / 60)}h this week`, [weekMinutes])
  const totalHM = useMemo(() => formatHoursMinutes(totalMinutes), [totalMinutes])
  const goalPercent = useMemo(() => {
    if (!goalTarget) return 0
    return Math.max(0, Math.min(100, Math.round((goalCompleted / goalTarget) * 100)))
  }, [goalCompleted, goalTarget])

  useEffect(() => {
    const now = Date.now()
    const months: { label: string; year: number; monthIndex: number; key: string }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      d.setDate(1)
      const label = d.toLocaleString('default', { month: 'long' })
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.push({ label, year: d.getFullYear(), monthIndex: d.getMonth(), key })
    }
    setLineData(months.map((m) => ({ month: m.label, pdf: 0, audio: 0 })))
    setBarData(months.map((m) => ({ month: m.label, total: 0 })))
    setPieData([{ name: 'PDF', value: 0 }, { name: 'Audio', value: 0 }])
    const today = new Date(now)
    const dayOfWeek = today.getDay()
    const sunday = new Date(today)
    sunday.setDate(today.getDate() - dayOfWeek)
    sunday.setHours(0,0,0,0)
    const weekPoints: { date: string; reading: number; audio: number }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      const dayStart = startOfDay(d.getTime())
      weekPoints.push({ date: new Date(dayStart).toISOString(), reading: 0, audio: 0 })
    }
    setWeekData(weekPoints)
  }, [])

  useEffect(() => {
    if (!(auth as any)?.app) return
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      let uid = user?.uid || localStorage.getItem('auth_user') || ''

      let finishedDocs: { id: string; status?: string; finishedTs?: number }[] = []
      let readingLogs: { minutes: number; ts: number }[] = []
      let activityTs: number[] = []
      let totalTarget = 0
      let units: Set<string> = new Set()
      let completedPdf = 0
      let completedAudio = 0
      let pdfCompletedTs: number[] = []
      let audioCompletedTs: number[] = []
      let readingLastTs: number[] = []
      let audioLastTs: number[] = []
      const now = Date.now()
      const todayStart = startOfDay(now)

      if (uid && db) {
        try {
          await setDoc(doc(db, 'users', uid, 'appActivity', String(todayStart)), { ts: now }, { merge: true })
        } catch {}
        try {
          const snap = await getDocs(collection(db, 'users', uid, 'my_library'))
          finishedDocs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        } catch {}
        try {
          const logsSnap = await getDocs(collection(db, 'users', uid, 'readingTime'))
          readingLogs = logsSnap.docs.map((d) => ({ minutes: Number((d.data() as any)?.minutes || 0), ts: Number((d.data() as any)?.ts || 0) })).filter((x) => x.minutes > 0 && x.ts > 0)
        } catch {}
        try {
          const rpSnap = await getDocs(collection(db, 'users', uid, 'readingProgress'))
          const rpLast = rpSnap.docs.map((d) => Number((d.data() as any)?.lastActivityTs || 0)).filter((x) => x > 0)
          activityTs.push(...rpLast)
          readingLastTs.push(...rpLast)
          completedPdf = rpSnap.docs.filter((d) => Number((d.data() as any)?.completedTs || 0) > 0).length
          pdfCompletedTs = rpSnap.docs.map((d) => Number((d.data() as any)?.completedTs || 0)).filter((x) => x > 0)
        } catch {}
        try {
          const apSnap = await getDocs(collection(db, 'users', uid, 'audioProgress'))
          const apLast = apSnap.docs.map((d) => Number((d.data() as any)?.lastActivityTs || 0)).filter((x) => x > 0)
          activityTs.push(...apLast)
          audioLastTs.push(...apLast)
          completedAudio = apSnap.docs.filter((d) => Number((d.data() as any)?.completedTs || 0) > 0).length
          audioCompletedTs = apSnap.docs.map((d) => Number((d.data() as any)?.completedTs || 0)).filter((x) => x > 0)
        } catch {}
        try {
          const actSnap = await getDocs(collection(db, 'users', uid, 'appActivity'))
          activityTs.push(...actSnap.docs.map((d) => Number((d.data() as any)?.ts || 0)).filter((x) => x > 0))
        } catch {}
        try {
          const goalsSnap = await getDocs(collection(db, 'users', uid, 'readingGoals'))
          const goals = goalsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
          goals.forEach((g) => { if (g.id !== 'current') { totalTarget += Number(g?.target || g?.targetAmount || 0); const u = String(g?.unit || '').trim(); if (u) units.add(u) } })
        } catch {}
      }

      if (!uid) {
        try {
          const rawDays = localStorage.getItem('appActivityDays')
          const arr = rawDays ? JSON.parse(rawDays) : []
          const exists = Array.isArray(arr) ? arr.some((d: any) => Number(d) === Number(todayStart)) : false
          const next = Array.isArray(arr) ? (exists ? arr : [...arr, todayStart]) : [todayStart]
          localStorage.setItem('appActivityDays', JSON.stringify(next))
        } catch {}
        try {
          const raw = localStorage.getItem('my_library')
          const list = raw ? JSON.parse(raw) : []
          finishedDocs = Array.isArray(list) ? list : []
        } catch {}
        try {
          const raw = localStorage.getItem('readingTimeLogs')
          const list = raw ? JSON.parse(raw) : []
          readingLogs = Array.isArray(list) ? list : []
        } catch {}
        try {
          const i: number[] = []
          for (let k = 0; k < localStorage.length; k++) {
            const key = localStorage.key(k) || ''
            if (key.startsWith('readingProgress:') || key.startsWith('audioProgress:')) {
              try {
                const v = localStorage.getItem(key)
                const obj = v ? JSON.parse(v) : null
                const ts = Number(obj?.lastActivityTs || 0)
                if (ts > 0) i.push(ts)
                if (key.startsWith('readingProgress:')) { if (Number(obj?.completedTs || 0) > 0) completedPdf += 1 }
                if (key.startsWith('audioProgress:')) { if (Number(obj?.completedTs || 0) > 0) completedAudio += 1 }
                const cts = Number(obj?.completedTs || 0)
                if (key.startsWith('readingProgress:') && cts > 0) pdfCompletedTs.push(cts)
                if (key.startsWith('audioProgress:') && cts > 0) audioCompletedTs.push(cts)
                if (key.startsWith('readingProgress:') && ts > 0) readingLastTs.push(ts)
                if (key.startsWith('audioProgress:') && ts > 0) audioLastTs.push(ts)
              } catch {}
            }
          }
          try {
            const rawDays = localStorage.getItem('appActivityDays')
            const arr = rawDays ? JSON.parse(rawDays) : []
            if (Array.isArray(arr)) { arr.forEach((d: any) => { const ts = Number(d || 0); if (ts > 0) i.push(ts) }) }
          } catch {}
          activityTs = i
        } catch {}
        try {
          const raw = localStorage.getItem('readingGoals')
          const list = raw ? JSON.parse(raw) : []
          if (Array.isArray(list)) { list.forEach((g: any) => { totalTarget += Number(g?.target || g?.targetAmount || 0); const u = String(g?.unit || '').trim(); if (u) units.add(u) }) }
        } catch {}
      }

      const finishedList = finishedDocs.filter((d) => String(d.status || '').toLowerCase() === 'finished')
      const totalFinishedCount = finishedList.length

      
      const oneDay = 24 * 60 * 60 * 1000
      const last30Start = now - 30 * oneDay
      const prev30Start = now - 60 * oneDay
      const last30 = finishedList.filter((d) => Number(d.finishedTs || 0) >= last30Start).length
      const prev30 = finishedList.filter((d) => Number(d.finishedTs || 0) >= prev30Start && Number(d.finishedTs || 0) < last30Start).length
      const delta = Math.max(0, last30 - prev30)

      const totalMin = readingLogs.reduce((s, x) => s + Math.max(0, Number(x.minutes || 0)), 0)
      const weekStart = now - 7 * oneDay
      const weekMin = readingLogs.filter((x) => Number(x.ts || 0) >= weekStart).reduce((s, x) => s + Math.max(0, Number(x.minutes || 0)), 0)

      const days = new Set<number>(activityTs.map((ts) => startOfDay(ts)))
      let streakCount = 0
      for (let i = 0; i < 365; i++) {
        const dayTs = startOfDay(now - i * oneDay)
        if (days.has(dayTs)) streakCount += 1
        else break
      }

      setTotalFinished(totalFinishedCount)
      setMonthDelta(delta)
      setTotalMinutes(totalMin)
      setWeekMinutes(weekMin)
      setStreak(streakCount)
      const combinedCompleted = completedPdf + completedAudio
      const goalDone = Math.min(totalTarget || 0, combinedCompleted)
      setGoalTarget(totalTarget || 0)
      setGoalCompleted(goalDone)
      const label: 'Books' | 'Audiobooks' | 'Items' = units.size === 1 ? (units.has('AudioBooks') ? 'Audiobooks' : 'Books') : units.size === 0 ? 'Books' : 'Items'
      setGoalUnitLabel(label)
      const months: { label: string; year: number; monthIndex: number; key: string }[] = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now)
        d.setMonth(d.getMonth() - i)
        d.setDate(1)
        const label = d.toLocaleString('default', { month: 'long' })
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        months.push({ label, year: d.getFullYear(), monthIndex: d.getMonth(), key })
      }
      const readingByMonth = new Map<string, number>()
      months.forEach((m) => readingByMonth.set(m.key, 0))
      readingLogs.forEach((log) => {
        const d = new Date(Number(log.ts || 0))
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (readingByMonth.has(key)) readingByMonth.set(key, (readingByMonth.get(key) || 0) + Math.max(0, Number(log.minutes || 0)))
      })
      const pdfByMonth = new Map<string, number>()
      const audioByMonth = new Map<string, number>()
      months.forEach((m) => { pdfByMonth.set(m.key, 0); audioByMonth.set(m.key, 0) })
      pdfCompletedTs.forEach((ts) => {
        const d = new Date(ts)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (pdfByMonth.has(key)) pdfByMonth.set(key, (pdfByMonth.get(key) || 0) + 1)
      })
      audioCompletedTs.forEach((ts) => {
        const d = new Date(ts)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (audioByMonth.has(key)) audioByMonth.set(key, (audioByMonth.get(key) || 0) + 1)
      })
      const nextLine = months.map((m) => ({ month: m.label, pdf: pdfByMonth.get(m.key) || 0, audio: audioByMonth.get(m.key) || 0 }))
      setLineData(nextLine)
      const finishedByMonth = new Map<string, number>()
      months.forEach((m) => finishedByMonth.set(m.key, 0))
      finishedList.forEach((d) => {
        const ts = Number(d.finishedTs || 0)
        if (ts > 0) {
          const dt = new Date(ts)
          const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
          if (finishedByMonth.has(key)) finishedByMonth.set(key, (finishedByMonth.get(key) || 0) + 1)
        }
      })
      const nextBar = months.map((m) => ({ month: m.label, total: finishedByMonth.get(m.key) || 0 }))
      setBarData(nextBar)
      setPieData([{ name: 'PDF', value: completedPdf }, { name: 'Audio', value: completedAudio }])
      const weekPoints: { date: string; reading: number; audio: number }[] = []
      const today = new Date(now)
      const dayOfWeek = today.getDay()
      const sunday = new Date(today)
      sunday.setDate(today.getDate() - dayOfWeek)
      sunday.setHours(0,0,0,0)
      for (let i = 0; i < 7; i++) {
        const d = new Date(sunday)
        d.setDate(sunday.getDate() + i)
        const dayStart = startOfDay(d.getTime())
        const readingMin = readingLogs.filter((x) => startOfDay(Number(x.ts || 0)) === dayStart).reduce((s, x) => s + Math.max(0, Number(x.minutes || 0)), 0)
        const audioCount = audioLastTs.filter((ts) => startOfDay(ts) === dayStart).length
        weekPoints.push({ date: new Date(dayStart).toISOString(), reading: readingMin, audio: audioCount })
      }
      setWeekData(weekPoints)
      // initial compute
      const unitsSet = units
      recompute(finishedDocs, readingLogs, activityTs, audioLastTs, pdfCompletedTs, audioCompletedTs, totalTarget, unitsSet)
    }
    run()
  }, [user?.uid])

  useEffect(() => {
    const loadNote = async () => {
      try {
        if (!selectedDate) return
        const key = new Date(selectedDate).toISOString().slice(0,10)
        if (user?.uid && db) {
          const ref = doc(db, 'users', user.uid, 'activityNotes', key)
          const snap = await getDoc(ref)
          const data = snap.exists() ? (snap.data() as any) : null
          setNoteText(String(data?.note || ''))
        } else {
          const raw = localStorage.getItem('activityNotes')
          const obj = raw ? JSON.parse(raw) : {}
          setNoteText(String((obj?.[key]?.note) || ''))
        }
      } catch {}
    }
    loadNote()
  }, [selectedDate, user?.uid])

  const recompute = (
    finishedDocs: { id: string; status?: string; finishedTs?: number }[],
    readingLogs: { minutes: number; ts: number }[],
    activityTs: number[],
    audioLastTs: number[],
    pdfCompletedTs: number[],
    audioCompletedTs: number[],
    totalTarget: number,
    units: Set<string>
  ) => {
    const now = Date.now()
    const finishedList = finishedDocs.filter((d) => String(d.status || '').toLowerCase() === 'finished')
    const totalFinishedCount = finishedList.length
    const oneDay = 24 * 60 * 60 * 1000
    const last30Start = now - 30 * oneDay
    const prev30Start = now - 60 * oneDay
    const last30 = finishedList.filter((d) => Number(d.finishedTs || 0) >= last30Start).length
    const prev30 = finishedList.filter((d) => Number(d.finishedTs || 0) >= prev30Start && Number(d.finishedTs || 0) < last30Start).length
    const delta = Math.max(0, last30 - prev30)
    const totalMin = readingLogs.reduce((s, x) => s + Math.max(0, Number(x.minutes || 0)), 0)
    const weekStart = now - 7 * oneDay
    const weekMin = readingLogs.filter((x) => Number(x.ts || 0) >= weekStart).reduce((s, x) => s + Math.max(0, Number(x.minutes || 0)), 0)
    const days = new Set<number>(activityTs.map((ts) => startOfDay(ts)))
    let streakCount = 0
    for (let i = 0; i < 365; i++) {
      const dayTs = startOfDay(now - i * oneDay)
      if (days.has(dayTs)) streakCount += 1
      else break
    }
    setTotalFinished(totalFinishedCount)
    setMonthDelta(delta)
    setTotalMinutes(totalMin)
    setWeekMinutes(weekMin)
    setStreak(streakCount)
    const combinedCompleted = (pdfCompletedTs?.length || 0) + (audioCompletedTs?.length || 0)
    const goalDone = Math.min(totalTarget || 0, combinedCompleted)
    setGoalTarget(totalTarget || 0)
    setGoalCompleted(goalDone)
    const label: 'Books' | 'Audiobooks' | 'Items' = units.size === 1 ? (units.has('AudioBooks') ? 'Audiobooks' : 'Books') : units.size === 0 ? 'Books' : 'Items'
    setGoalUnitLabel(label)
    const months: { label: string; year: number; monthIndex: number; key: string }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      d.setDate(1)
      const label = d.toLocaleString('default', { month: 'long' })
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.push({ label, year: d.getFullYear(), monthIndex: d.getMonth(), key })
    }
    const readingByMonth = new Map<string, number>()
    months.forEach((m) => readingByMonth.set(m.key, 0))
    readingLogs.forEach((log) => {
      const d = new Date(Number(log.ts || 0))
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (readingByMonth.has(key)) readingByMonth.set(key, (readingByMonth.get(key) || 0) + Math.max(0, Number(log.minutes || 0)))
    })
    const pdfByMonth = new Map<string, number>()
    const audioByMonth = new Map<string, number>()
    months.forEach((m) => { pdfByMonth.set(m.key, 0); audioByMonth.set(m.key, 0) })
    pdfCompletedTs.forEach((ts) => {
      const d = new Date(ts)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (pdfByMonth.has(key)) pdfByMonth.set(key, (pdfByMonth.get(key) || 0) + 1)
    })
    audioCompletedTs.forEach((ts) => {
      const d = new Date(ts)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (audioByMonth.has(key)) audioByMonth.set(key, (audioByMonth.get(key) || 0) + 1)
    })
    const nextLine = months.map((m) => ({ month: m.label, pdf: pdfByMonth.get(m.key) || 0, audio: audioByMonth.get(m.key) || 0 }))
    setLineData(nextLine)
    const finishedByMonth = new Map<string, number>()
    months.forEach((m) => finishedByMonth.set(m.key, 0))
    finishedDocs.forEach((d) => {
      const ts = Number(d.finishedTs || 0)
      if (ts > 0) {
        const dt = new Date(ts)
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
        if (finishedByMonth.has(key)) finishedByMonth.set(key, (finishedByMonth.get(key) || 0) + 1)
      }
    })
    const nextBar = months.map((m) => ({ month: m.label, total: finishedByMonth.get(m.key) || 0 }))
    setBarData(nextBar)
    setPieData([{ name: 'PDF', value: pdfCompletedTs.length }, { name: 'Audio', value: audioCompletedTs.length }])
    const weekPoints: { date: string; reading: number; audio: number }[] = []
    const today = new Date(now)
    const dayOfWeek = today.getDay()
    const sunday = new Date(today)
    sunday.setDate(today.getDate() - dayOfWeek)
    sunday.setHours(0,0,0,0)
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      const dayStart = startOfDay(d.getTime())
      const readingMin = readingLogs.filter((x) => startOfDay(Number(x.ts || 0)) === dayStart).reduce((s, x) => s + Math.max(0, Number(x.minutes || 0)), 0)
      const audioCount = audioLastTs.filter((ts) => startOfDay(ts) === dayStart).length
      weekPoints.push({ date: new Date(dayStart).toISOString(), reading: readingMin, audio: audioCount })
    }
    setWeekData(weekPoints)
    setLoading(false)
  }

  useEffect(() => {
    const uid = user?.uid || ''
    if (!(uid && db)) return
    let finishedDocs: { id: string; status?: string; finishedTs?: number }[] = []
    let readingLogs: { minutes: number; ts: number }[] = []
    let activityTs: number[] = []
    let totalTarget = 0
    let units: Set<string> = new Set()
    let pdfCompletedTs: number[] = []
    let audioCompletedTs: number[] = []
    let audioLastTs: number[] = []
    const u1 = onSnapshot(collection(db, 'users', uid, 'my_library'), (snap) => {
      finishedDocs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      recompute(finishedDocs, readingLogs, activityTs, audioLastTs, pdfCompletedTs, audioCompletedTs, totalTarget, units)
    })
    const u2 = onSnapshot(collection(db, 'users', uid, 'readingTime'), (snap) => {
      readingLogs = snap.docs.map((d) => ({ minutes: Number((d.data() as any)?.minutes || 0), ts: Number((d.data() as any)?.ts || 0) })).filter((x) => x.minutes > 0 && x.ts > 0)
      recompute(finishedDocs, readingLogs, activityTs, audioLastTs, pdfCompletedTs, audioCompletedTs, totalTarget, units)
    })
    const u3 = onSnapshot(collection(db, 'users', uid, 'readingProgress'), (snap) => {
      const rpLast = snap.docs.map((d) => Number((d.data() as any)?.lastActivityTs || 0)).filter((x) => x > 0)
      activityTs = [...rpLast]
      pdfCompletedTs = snap.docs.map((d) => Number((d.data() as any)?.completedTs || 0)).filter((x) => x > 0)
      recompute(finishedDocs, readingLogs, activityTs, audioLastTs, pdfCompletedTs, audioCompletedTs, totalTarget, units)
    })
    const u4 = onSnapshot(collection(db, 'users', uid, 'audioProgress'), (snap) => {
      const apLast = snap.docs.map((d) => Number((d.data() as any)?.lastActivityTs || 0)).filter((x) => x > 0)
      activityTs = [...activityTs, ...apLast]
      audioLastTs = [...apLast]
      audioCompletedTs = snap.docs.map((d) => Number((d.data() as any)?.completedTs || 0)).filter((x) => x > 0)
      recompute(finishedDocs, readingLogs, activityTs, audioLastTs, pdfCompletedTs, audioCompletedTs, totalTarget, units)
    })
    const u5 = onSnapshot(collection(db, 'users', uid, 'appActivity'), (snap) => {
      const arr = snap.docs.map((d) => Number((d.data() as any)?.ts || 0)).filter((x) => x > 0)
      activityTs = [...activityTs, ...arr]
      recompute(finishedDocs, readingLogs, activityTs, audioLastTs, pdfCompletedTs, audioCompletedTs, totalTarget, units)
    })
    const u6 = onSnapshot(collection(db, 'users', uid, 'readingGoals'), (snap) => {
      totalTarget = 0
      units = new Set()
      const goals = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      goals.forEach((g) => { if (g.id !== 'current') { totalTarget += Number(g?.target || g?.targetAmount || 0); const u = String(g?.unit || '').trim(); if (u) units.add(u) } })
      recompute(finishedDocs, readingLogs, activityTs, audioLastTs, pdfCompletedTs, audioCompletedTs, totalTarget, units)
    })
    return () => { u1(); u2(); u3(); u4(); u5(); u6() }
  }, [user?.uid])

  return (
    <div className="px-2 sm:px-4 lg:px-7 pt-8">
      <div>
        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900">My Activity</h2>
        <div className="mt-3 mb-6 rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between">
          <div className="text-sm text-slate-500">Track your literary journey and celebrate every milestone.</div>
          <button
            type="button"
            className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-cyan-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
            onClick={() => {
              try {
                const monthRows = barData.map((b) => `<tr><td>${b.month}</td><td>${b.total}</td></tr>`).join('')
                const lineRows = lineData.map((l) => `<tr><td>${l.month}</td><td>${l.pdf}</td><td>${l.audio}</td></tr>`).join('')
                const weekRows = weekData.map((w) => `<tr><td>${new Date(w.date).toLocaleDateString()}</td><td>${w.reading}</td><td>${w.audio}</td></tr>`).join('')
                const html = `<!doctype html><html><head><meta charset=\"utf-8\"><title>My Activity</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;color:#0f172a}h1{font-size:20px;margin:0 0 12px}h2{font-size:16px;margin:16px 0 8px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #e2e8f0;padding:6px;text-align:left}th{background:#f8fafc}small{color:#64748b}</style></head><body><h1>My Activity</h1><small>Generated ${new Date().toLocaleString()}</small><table><tbody><tr><th>Total Books Read</th><td>${String(totalFinished)}</td></tr><tr><th>Total Hours Read</th><td>${String(totalHM)}</td></tr><tr><th>Current Streak</th><td>${String(streak)} days</td></tr><tr><th>Reading Goal Progress</th><td>${String(goalCompleted)}/${String(goalTarget)} ${String(goalUnitLabel)} (${String(goalPercent)}%)</td></tr><tr><th>This Week</th><td>${String(weekDeltaLabel)}</td></tr></tbody></table><h2>Monthly Totals</h2><table><thead><tr><th>Month</th><th>Finished</th></tr></thead><tbody>${monthRows}</tbody></table><h2>Monthly PDF vs Audio</h2><table><thead><tr><th>Month</th><th>PDF</th><th>Audio</th></tr></thead><tbody>${lineRows}</tbody></table><h2>Weekly Activity</h2><table><thead><tr><th>Date</th><th>Reading Minutes</th><th>Audio Sessions</th></tr></thead><tbody>${weekRows}</tbody></table></body></html>`
                const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1200')
                if (!w) return
                w.document.open()
                w.document.write(html)
                w.document.close()
                w.focus()
                w.print()
              } catch {}
            }}
          >
            Download PDF document
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-xl shadow-sm border border-slate-200 bg-white p-6">
          <div className="text-sm text-slate-500">Total Books Read</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{loading ? '—' : totalFinished}</div>
          <div className={`mt-1 text-xs font-medium ${loading ? '' : (monthDelta >= 1 ? 'text-emerald-600' : 'text-red-400')}`}>{loading ? '' : `+${monthDelta} from this month`}</div>
        </div>
        <div className="rounded-xl shadow-sm border border-slate-200 bg-white p-6">
          <div className="text-sm text-slate-500">Total Hours Read</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{loading ? '—' : totalHM}</div>
          <div className={`mt-1 text-xs font-medium ${loading ? '' : (Math.floor(weekMinutes / 60) >= 1 ? 'text-emerald-600' : 'text-red-400')}`}>{loading ? '' : `+${weekDeltaLabel}`}</div>
        </div>
        <div className="rounded-xl shadow-sm border border-slate-200 bg-white p-6">
          <div className="text-sm text-slate-500">Current Streak</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{loading ? '—' : `${streak} days`}</div>
          <div className="mt-1 text-xs font-medium text-slate-400">{loading ? '' : 'Keep going'}</div>
        </div>
        <div className="rounded-xl shadow-sm border border-slate-200 bg-white p-6 relative">
          <div className="text-sm text-slate-500">Reading Goal Progress</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{loading ? '—' : `${goalCompleted}/${goalTarget || 0} ${goalUnitLabel}`}</div>
          <div className={`mt-1 text-xs font-medium ${loading ? '' : (goalPercent >= 1 ? 'text-emerald-600' : 'text-red-400')}`}>{loading ? '' : `${goalPercent}% completed`}</div>
          
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
        <div className="lg:col-span-3">
          <ChartLineMultiple data={lineData} title="Monthly Activity" desc="Last 12 months" />
        </div>
        <div className="lg:col-span-1">
          <div className="space-y-6">
            <ChartPieDonutText data={pieData} title="Activity Breakdown" desc="PDF vs Audio" />
            <ChartTooltipLabelFormatter data={weekData} title="Weekly Activity" desc="Sun - Sat" />
          </div>
        </div>
        <div className="lg:col-span-2">
          <ChartBarDefault data={barData} title="Totals by Month" desc="Last 12 months" />
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-sm font-bold text-slate-600">Calendar</div>
            <div className="mt-4">
              <Calendar selected={selectedDate} onSelect={(d: Date | undefined) => { setSelectedDate(d); }} className="w-full text-[11px]" />
            </div>
            <div className="mt-4">
              <div className="text-sm text-slate-500">Note</div>
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="mt-2 w-full rounded-md border border-slate-300 p-2" rows={4} placeholder="Write a note for the selected date" />
              <div className="mt-2 flex gap-3 justify-end">
                <button type="button" className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600" onClick={async () => {
                  try {
                    if (!selectedDate) return
                    const key = new Date(selectedDate).toISOString().slice(0,10)
                    if (user?.uid && db) {
                      await deleteDoc(doc(db, 'users', user.uid, 'activityNotes', key))
                    } else {
                      const raw = localStorage.getItem('activityNotes')
                      const obj = raw ? JSON.parse(raw) : {}
                      delete obj[key]
                      localStorage.setItem('activityNotes', JSON.stringify(obj))
                    }
                    setNoteText('')
                  } catch {}
                }}>Delete Note</button>
                <button type="button" className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-cyan-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700" onClick={async () => {
                  try {
                    if (!selectedDate) return
                    const key = new Date(selectedDate).toISOString().slice(0,10)
                    if (user?.uid && db) {
                      await setDoc(doc(db, 'users', user.uid, 'activityNotes', key), { note: noteText, ts: Date.now() }, { merge: true })
                    } else {
                      const raw = localStorage.getItem('activityNotes')
                      const obj = raw ? JSON.parse(raw) : {}
                      obj[key] = { note: noteText, ts: Date.now() }
                      localStorage.setItem('activityNotes', JSON.stringify(obj))
                    }
                  } catch {}
                }}>Save Note</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
