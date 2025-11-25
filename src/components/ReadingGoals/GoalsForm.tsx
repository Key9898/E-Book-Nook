import { useState } from 'react'

type GoalItem = { id?: string; name: string; target: number; deadlineTs?: number; unit: 'PdfBooks' | 'AudioBooks' }

interface GoalsFormProps {
  initialGoal?: GoalItem
  onSaved?: (goal: GoalItem) => void
  onCancel?: () => void
}

export default function GoalsForm({ initialGoal, onSaved, onCancel }: GoalsFormProps) {
  const [name, setName] = useState(initialGoal?.name || '')
  const [target, setTarget] = useState<number>(initialGoal?.target || 0)
  const [deadline, setDeadline] = useState<string>(initialGoal?.deadlineTs ? new Date(initialGoal.deadlineTs).toISOString().slice(0, 10) : '')
  const [unit, setUnit] = useState<'PdfBooks' | 'AudioBooks'>(initialGoal?.unit || 'PdfBooks')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const g: GoalItem = {
      id: initialGoal?.id,
      name: name.trim(),
      target: Math.max(0, Math.floor(Number(target || 0))),
      deadlineTs: deadline ? new Date(deadline).getTime() : undefined,
      unit,
    }
    if (onSaved) onSaved(g)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="goalName" className="block text-sm font-medium text-slate-700">Give your goal a name</label>
        <input id="goalName" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Monthly Tech Reading" className="block w-full rounded-xl bg-white px-3.5 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-300 placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600" />
      </div>
      <div>
        <label htmlFor="targetAmount" className="block text-sm font-medium text-slate-700">How many pdf books or audiobooks?</label>
        <input id="targetAmount" type="number" min={0} value={target} onChange={(e) => setTarget(Math.max(0, Math.floor(Number(e.target.value || 0))))} placeholder="e.g., 5" className="block w-full rounded-xl bg-white px-3.5 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-300 placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600" />
      </div>
      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-slate-700">When do you want to finish?</label>
        <input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="block w-full rounded-xl bg-white px-3.5 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-300 placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600" />
      </div>
      <div>
        <label htmlFor="unit" className="block text-sm font-medium text-slate-700">Unit</label>
        <select id="unit" value={unit} onChange={(e) => setUnit(e.target.value as any)} className="block w-full rounded-xl bg-white px-3.5 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-300 placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600">
          <option value="PdfBooks">PdfBooks</option>
          <option value="AudioBooks">AudioBooks</option>
        </select>
      </div>
      <div className="pt-2 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-900">Cancel</button>
        <button type="submit" className="rounded-xl bg-cyan-700 px-3 py-2 text-sm font-semibold text-white">Save</button>
      </div>
    </form>
  )
}
