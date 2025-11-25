import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { auth, db } from "../firebaseConfig"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'

export type BookProgress = {
  totalPages: number
  currentPage: number
  startedTs?: number
  completedTs?: number
  lastActivityTs?: number
}

export function getBookStatus(p: BookProgress, now = Date.now(), completionThreshold = 0.9, activeWindowMs = 120000) {
  const total = Math.max(1, p.totalPages)
  const cur = Math.max(0, Math.min(p.currentPage, total))
  const percent = cur / total
  const completed = !!p.completedTs || percent >= completionThreshold
  const notStarted = !p.startedTs && cur <= 1
  const status: ProgressStatus = completed ? 'completed' : notStarted ? 'not_started' : 'in_progress'
  const active = !!p.lastActivityTs && now - p.lastActivityTs <= activeWindowMs
  return { status, percent, active }
}

export function updateBookOnOpen(p: BookProgress) {
  const ts = Date.now()
  return { ...p, startedTs: p.startedTs || ts, lastActivityTs: ts }
}

export function updateBookOnProgress(p: BookProgress, nextPage: number) {
  return { ...p, currentPage: nextPage, lastActivityTs: Date.now() }
}

export function updateBookOnComplete(p: BookProgress) {
  const ts = Date.now()
  return { ...p, currentPage: p.totalPages, completedTs: ts, lastActivityTs: ts }
}

export type AudioProgress = {
  durationMs: number
  positionMs: number
  playing: boolean
  startedTs?: number
  completedTs?: number
  lastActivityTs?: number
}

export function getAudioStatus(p: AudioProgress, now = Date.now(), completionThreshold = 0.9, activeWindowMs = 120000) {
  const dur = Math.max(1, p.durationMs)
  const pos = Math.max(0, Math.min(p.positionMs, dur))
  const percent = pos / dur
  const completed = !!p.completedTs || percent >= completionThreshold
  const notStarted = !p.startedTs && pos <= 1000
  const status: ProgressStatus = completed ? 'completed' : notStarted ? 'not_started' : 'in_progress'
  const active = p.playing || (!!p.lastActivityTs && now - p.lastActivityTs <= activeWindowMs)
  return { status, percent, active }
}

export function updateAudioOnOpen(p: AudioProgress) {
  const ts = Date.now()
  return { ...p, startedTs: p.startedTs || ts, lastActivityTs: ts }
}

export function updateAudioOnProgress(p: AudioProgress, nextPosMs: number, playing: boolean) {
  return { ...p, positionMs: nextPosMs, playing, lastActivityTs: Date.now() }
}

export function updateAudioOnComplete(p: AudioProgress) {
  const ts = Date.now()
  return { ...p, positionMs: p.durationMs, playing: false, completedTs: ts, lastActivityTs: ts }
}

export async function saveBookProgress(bookId: string, progress: BookProgress) {
  const uid = auth?.currentUser?.uid || localStorage.getItem('auth_user') || ''
  if (uid && db) {
    try {
      await setDoc(doc(db, 'users', uid, 'readingProgress', bookId), { ...progress, updatedAt: serverTimestamp() }, { merge: true })
      return
    } catch {}
  }
  try { localStorage.setItem(`readingProgress:${bookId}`, JSON.stringify(progress)) } catch {}
}

export async function loadBookProgress(bookId: string): Promise<BookProgress | null> {
  const uid = auth?.currentUser?.uid || localStorage.getItem('auth_user') || ''
  if (uid && db) {
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'readingProgress', bookId))
      if (snap.exists()) return snap.data() as BookProgress
    } catch {}
  }
  try {
    const raw = localStorage.getItem(`readingProgress:${bookId}`)
    return raw ? (JSON.parse(raw) as BookProgress) : null
  } catch { return null }
}

export async function saveAudioProgress(audioId: string, progress: AudioProgress) {
  const uid = auth?.currentUser?.uid || localStorage.getItem('auth_user') || ''
  if (uid && db) {
    try {
      await setDoc(doc(db, 'users', uid, 'audioProgress', audioId), { ...progress, updatedAt: serverTimestamp() }, { merge: true })
      return
    } catch {}
  }
  try { localStorage.setItem(`audioProgress:${audioId}`, JSON.stringify(progress)) } catch {}
}

export async function loadAudioProgress(audioId: string): Promise<AudioProgress | null> {
  const uid = auth?.currentUser?.uid || localStorage.getItem('auth_user') || ''
  if (uid && db) {
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'audioProgress', audioId))
      if (snap.exists()) return snap.data() as AudioProgress
    } catch {}
  }
  try {
    const raw = localStorage.getItem(`audioProgress:${audioId}`)
    return raw ? (JSON.parse(raw) as AudioProgress) : null
  } catch { return null }
}