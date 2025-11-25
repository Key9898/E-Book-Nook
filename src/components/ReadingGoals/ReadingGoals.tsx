import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { PiListBulletsBold } from 'react-icons/pi'
import ListView from './ListView'
import Header from '../Layouts/Header'
import Footer from '../Layouts/Footer'
import ScrollToTopButton from '../Layouts/ScrollUpToTopButton'
import HeroBanner from '../Layouts/HeroBanner'
import Breadcrumb from '../Layouts/Breadcrumb'
import { auth, db } from '../../firebaseConfig'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { ReactFlow, Controls, Background, Panel, BackgroundVariant, applyNodeChanges, applyEdgeChanges, addEdge, Handle, Position, NodeResizer, type Node, type Edge, type NodeChange, type EdgeChange, type Connection, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

interface ReadingGoalsProps { onNavigate?: (page: string) => void }
type EditableData = { label: string; onChange?: (id: string, v: string) => void }

const initialNodes: Node[] = [
  { id: 'n1', type: 'editable', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: 'n2', type: 'editable', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
]
const initialEdges: Edge[] = [{ id: 'n1-n2', source: 'n1', target: 'n2' }]

export default function ReadingGoals({ onNavigate }: ReadingGoalsProps) {
  const [user, setUser] = useState<User | null>(auth?.currentUser || null)
  const [view, setView] = useState<'map' | 'list'>('map')
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const lastZoomRef = useRef<number>(1)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const flowRef = useRef<any>(null)
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [editingId, setEditingId] = useState<string | null>(null)
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null)
  const initialLoadedRef = useRef<boolean>(false)
  const fittedRef = useRef<boolean>(false)
  const saveTimerRef = useRef<number | null>(null)
  const [saving, setSaving] = useState(false)
  const lsKey = useMemo(() => (user?.uid ? `mindmap:${user.uid}` : ''), [user?.uid])

  function EditableNode({ id, data, selected }: NodeProps) {
    const [val, setVal] = useState<string>(String((data as EditableData)?.label ?? ''))
    const inputRef = useRef<HTMLTextAreaElement | null>(null)
    useEffect(() => { setVal(String((data as EditableData)?.label ?? '')) }, [data])
    useEffect(() => { if (editingId === id) inputRef.current?.focus() }, [editingId, id])
    return (
      <div className="relative w-full h-full rounded-xl border border-slate-300 bg-white shadow">
        <NodeResizer minWidth={120} minHeight={60} isVisible={!!selected} handleStyle={{ width: 10, height: 10 }} color="#0ea5b7" />
        {editingId === id ? (
          <textarea
            ref={inputRef}
            value={val}
            onChange={(e) => { setVal(e.target.value); (data as EditableData)?.onChange?.(id, e.target.value) }}
            onBlur={() => setEditingId(null)}
            className="w-full h-full p-3 text-sm bg-transparent outline-none resize-none"
            aria-label="Edit node label"
            placeholder="Type label..."
            rows={3}
          />
        ) : (
          <div
            onClick={(e) => { e.stopPropagation(); setEditingId(id) }}
            className="p-3 text-center text-sm font-medium text-slate-900 select-none"
          >
            {String((data as EditableData)?.label ?? '')}
          </div>
        )}
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </div>
    )
  }
  const nodeTypes = useMemo(() => ({ editable: EditableNode }), [])

  useEffect(() => {
    if (!(auth as any)?.app) return
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot))
  }, [])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot))
  }, [])
  const onConnect = useCallback((params: Connection) => {
    setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot))
  }, [])

  const onSelectionChange = useCallback((sel: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedIds((sel?.nodes || []).map((n) => n.id))
  }, [])

  useEffect(() => {
    if (!db || !user?.uid) return
    const ref = doc(db, 'mindmaps', user.uid)
    let first = true
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as any
      if (data?.nodes && data?.edges) {
        const loadedNodes: Node[] = (data.nodes as any[]).map((n) => ({ id: String(n.id), type: 'editable', position: { x: Number(n.position?.x || 0), y: Number(n.position?.y || 0) }, data: { label: String(n?.data?.label || '') } }))
        const loadedEdges: Edge[] = (data.edges as any[]).map((e) => ({ id: String(e.id || `${e.source}-${e.target}`), source: String(e.source), target: String(e.target) }))
        setNodes(loadedNodes)
        setEdges(loadedEdges)
      }
      if (first) {
        first = false
        initialLoadedRef.current = true
        setTimeout(() => { try { flowRef.current?.fitView?.({ padding: 0.1 }) } catch {} }, 0)
      }
    }, (err) => {
      initialLoadedRef.current = true
      try { window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Load failed', message: (err?.code || err?.message || 'Could not load mind map').toString() } })) } catch {}
      if (lsKey) {
        try {
          const raw = localStorage.getItem(lsKey)
          if (raw) {
            const local = JSON.parse(raw)
            const loadedNodes: Node[] = (local?.nodes || []).map((n: any) => ({ id: String(n.id), type: 'editable', position: { x: Number(n.position?.x || 0), y: Number(n.position?.y || 0) }, data: { label: String(n?.data?.label || '') } }))
            const loadedEdges: Edge[] = (local?.edges || []).map((e: any) => ({ id: String(e.id || `${e.source}-${e.target}`), source: String(e.source), target: String(e.target) }))
            if (loadedNodes.length) setNodes(loadedNodes)
            if (loadedEdges.length) setEdges(loadedEdges)
          }
        } catch {}
      }
    })
    return () => unsub()
  }, [db, user?.uid])

  useEffect(() => {
    if (!initialLoadedRef.current) return
    if (fittedRef.current) return
    try {
      flowRef.current?.fitView?.({ padding: 0.1 })
      fittedRef.current = true
    } catch {}
  }, [nodes])

  const persistMindMap = useCallback(async (uid: string, nodesArg: Node[], edgesArg: Edge[]) => {
    if (!db) return
    const ref = doc(db, 'mindmaps', uid)
    const nodesDoc = nodesArg.map((n) => ({ id: n.id, type: 'editable', position: n.position, data: { label: String((n.data as any)?.label || '') } }))
    const edgesDoc = edgesArg.map((e) => ({ id: e.id, source: e.source, target: e.target }))
    await setDoc(ref, { nodes: nodesDoc, edges: edgesDoc, updatedAt: serverTimestamp() }, { merge: true })
  }, [])

  const handleSave = useCallback(async () => {
    if (!user?.uid) return
    try {
      setSaving(true)
      await persistMindMap(user.uid, nodes, edges)
      try { window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Saved', message: 'Mind map saved.' } })) } catch {}
    } catch {
      try {
        if (lsKey) {
          const nodesDoc = nodes.map((n) => ({ id: n.id, type: 'editable', position: n.position, data: { label: String((n.data as any)?.label || '') } }))
          const edgesDoc = edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))
          localStorage.setItem(lsKey, JSON.stringify({ nodes: nodesDoc, edges: edgesDoc, ts: Date.now() }))
        }
        window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Save blocked', message: 'Saved locally. Please allow App Check or deploy rules.' } }))
      } catch {}
    } finally {
      setSaving(false)
    }
  }, [user?.uid, nodes, edges, persistMindMap, lsKey])

  useEffect(() => {
    if (!db || !user?.uid) return
    if (!initialLoadedRef.current) return
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      persistMindMap(user.uid, nodes, edges).catch((err) => {
        try {
          window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Save blocked', message: (err?.code || err?.message || 'Insufficient permissions').toString() } }))
        } catch {}
        try {
          if (lsKey) {
            const nodesDoc = nodes.map((n) => ({ id: n.id, type: 'editable', position: n.position, data: { label: String((n.data as any)?.label || '') } }))
            const edgesDoc = edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))
            localStorage.setItem(lsKey, JSON.stringify({ nodes: nodesDoc, edges: edgesDoc, ts: Date.now() }))
          }
        } catch {}
      })
    }, 500)
    return () => { if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current) }
  }, [nodes, edges, user?.uid])

  const addNode = useCallback(() => {
    setNodes((prev) => {
      const nextId = `n${prev.length + 1}`
      let pos: { x: number; y: number }
      const lastSelId = selectedIds[selectedIds.length - 1]
      const anchor = lastSelId ? prev.find((n) => n.id === lastSelId) : null
      if (anchor) {
        pos = { x: anchor.position.x + 180, y: anchor.position.y }
      } else if (prev.length) {
        let sx = 0, sy = 0
        prev.forEach((n) => { sx += n.position.x; sy += n.position.y })
        const cx = sx / prev.length
        const cy = sy / prev.length
        pos = { x: cx + 180, y: cy }
      } else {
        pos = { x: 0, y: 0 }
      }
      return [...prev, { id: nextId, type: 'editable', position: pos, data: { label: `Node ${prev.length + 1}` } }]
    })
  }, [selectedIds, containerSize.width, containerSize.height])

  const removeSelected = useCallback(() => {
    setNodes((prev) => prev.filter((n) => !selectedIds.includes(n.id)))
    setEdges((prev) => prev.filter((e) => !selectedIds.includes(e.source) && !selectedIds.includes(e.target)))
  }, [selectedIds])

  const onChangeLabel = useCallback((id: string, v: string) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, data: { ...(n.data as any), label: v } } : n)))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      const w = Math.round((rect?.width ?? el.clientWidth) || 0)
      const h = Math.round((rect?.height ?? el.clientHeight) || 0)
      setContainerSize({ width: w, height: h })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])


  const applyTreeLayout = useCallback(() => {
    setNodes((prev) => {
      const indeg: Record<string, number> = {}
      const adj: Record<string, string[]> = {}
      prev.forEach((n) => { indeg[n.id] = 0; adj[n.id] = [] })
      edges.forEach((e) => { indeg[e.target] = (indeg[e.target] ?? 0) + 1; if (!adj[e.source]) adj[e.source] = []; adj[e.source].push(e.target) })
      const roots = Object.keys(indeg).filter((id) => (indeg[id] ?? 0) === 0)
      const startIds = roots.length ? roots : [prev[0]?.id].filter(Boolean) as string[]
      const levels: string[][] = []
      const visited = new Set<string>()
      let frontier = startIds
      while (frontier.length) {
        const level: string[] = []
        const next: string[] = []
        frontier.forEach((id) => {
          if (visited.has(id)) return
          visited.add(id);
          level.push(id);
          (adj[id] || []).forEach((nx) => { if (!visited.has(nx)) next.push(nx) })
        })
        levels.push(level)
        frontier = next
      }
      const marginX = 40
      const marginY = 40
      const columns = Math.max(levels.length, 1)
      const targetWidth = Math.max((containerSize.width || 800) - marginX * 2, 320)
      let xGap = 220
      if (columns > 1) {
        xGap = Math.max(140, Math.min(220, Math.floor(targetWidth / (columns - 1))))
      }
      const maxLevelCount = Math.max(...levels.map((l) => l.length), 1)
      const targetHeight = Math.max((containerSize.height || 480) - marginY * 2, 240)
      let yGap = 120
      if (maxLevelCount > 1) {
        yGap = Math.max(80, Math.min(160, Math.floor(targetHeight / (maxLevelCount - 1))))
      }
      const totalWidth = (columns - 1) * xGap
      const centerX = (containerSize.width || 800) / 2
      const centerY = (containerSize.height || 480) / 2
      const baseX = centerX - totalWidth / 2
      const pos: Record<string, { x: number; y: number }> = {}
      levels.forEach((level, li) => {
        const count = level.length
        const startY = centerY - ((count - 1) * yGap) / 2
        level.forEach((id, idx) => {
          pos[id] = { x: Math.round(baseX + li * xGap), y: Math.round(startY + idx * yGap) }
        })
      })
      return prev.map((n) => ({ ...n, position: pos[n.id] ?? n.position }))
    })
    setTimeout(() => { try { flowRef.current?.fitView?.({ padding: 0.1 }) } catch {} }, 0)
  }, [edges, containerSize.width, containerSize.height])

  const breadcrumbPages = [
    { name: 'Reading Goals', href: '#readingGoals', current: true },
  ]

  return (
    <div className="bg-white">
      <Header onNavigate={onNavigate} />
      <HeroBanner
        onPrimaryAction={() => onNavigate?.('readingGoals')}
        title="Map Your Creative Literary Journey"
        description="Transform your reading ambitions into an interactive visual guide. Connect ideas, organize your book list, and track your progress to turn your yearly reading goals into achievable milestones"
        buttonText="Create Goals"
        backgroundImgAlt="Reading Goals banner"
        preTitleSlot={<Breadcrumb pages={breadcrumbPages} onNavigate={onNavigate} variant="dark" />}
        scrollTargetId="readingGoals-content"
      />
      <main id="readingGoals-content" className="mx-auto max-w-7xl px-5 sm:px-9 lg:px-8 pt-20 lg:pt-24 pb-20 lg:pb-24">
        {user ? (
          <div className="rounded-xl shadow-xl ring-1 ring-black/5 bg-slate-50 p-2">
            {view === 'map' && (
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="text-sm font-semibold text-cyan-800">Goals Map</div>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={'p-2 rounded-lg bg-slate-200 text-slate-800'}
                  aria-label="List View"
                  title="List View"
                >
                  <PiListBulletsBold className="size-5" />
                </button>
              </div>
            )}
            {view === 'map' ? (
              <div
                ref={containerRef}
                className="h-[70vh] w-full group"
                onWheelCapture={(e) => { if (!(e as any).ctrlKey) { const dy = (e as any).deltaY || 0; if (dy) window.scrollBy({ top: dy, behavior: 'auto' }) } }}
              >
                <ReactFlow
                  nodeTypes={nodeTypes}
                  nodes={nodes.map((n) => ({ ...n, type: 'editable', data: { ...(n.data as any), onChange: onChangeLabel } }))}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onSelectionChange={onSelectionChange as any}
                  zoomOnScroll={false}
                  panOnScroll={false}
                  zoomOnPinch={false}
                  onViewportChange={(vp) => {
                    const prev = lastZoomRef.current
                    if (vp?.zoom !== prev) {
                      const dir = (vp.zoom || 0) > (prev || 0) ? 'in' : 'out'
                      try { console.log(`Zoom ${dir}: ${Number(vp.zoom || 0).toFixed(2)}`) } catch {}
                      lastZoomRef.current = vp.zoom || prev
                    }
                    try {
                      const rect = containerRef.current?.getBoundingClientRect()
                      const px = (rect?.left ?? 0) + ((rect?.width ?? (containerSize.width || 800)) / 2)
                      const py = (rect?.top ?? 0) + ((rect?.height ?? (containerSize.height || 480)) / 2)
                      const projected = flowRef.current?.project?.({ x: px, y: py })
                      if (projected) lastCenterRef.current = { x: projected.x, y: projected.y }
                    } catch {}
                  }}
                  onInit={(inst) => { flowRef.current = inst }}
                  fitView
                >
                  <Background variant={BackgroundVariant.Dots} gap={32} color="#CBD5E1" />
                  <Controls position="bottom-left" />
                  <Panel position="top-left" className="opacity-100 -ml-2">
                    <div className="space-x-2">
                      <button type="button" onClick={addNode} title="Add node" className="rounded-xl bg-cyan-700 text-white px-2 py-1 text-xs font-semibold shadow hover:bg-cyan-600">+ Add</button>
                      <button type="button" onClick={removeSelected} title="Remove selected" className="rounded-xl bg-rose-600 text-white px-2 py-1 text-xs font-semibold shadow hover:bg-rose-500">− Remove</button>
                      <button type="button" onClick={applyTreeLayout} title="Apply tree layout" className="rounded-xl bg-indigo-600 text-white px-2 py-1 text-xs font-semibold shadow hover:bg-indigo-500">Tree Layout</button>
                      <button type="button" onClick={handleSave} disabled={saving || !user?.uid} title="Save mind map" className="rounded-xl bg-emerald-600 disabled:opacity-50 text-white px-2 py-1 text-xs font-semibold shadow hover:bg-emerald-500">{saving ? 'Saving…' : 'Save'}</button>
                    </div>
                  </Panel>
                </ReactFlow>
              </div>
            ) : (
              <div className="w-full">
                <ListView onSwitchToMap={() => setView('map')} />
              </div>
            )}
          </div>
        ) : null}
      </main>
      <ScrollToTopButton />
      <Footer onNavigate={onNavigate} />
    </div>
  )
}
