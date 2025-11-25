import { useState, useMemo } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { FaUserCircle } from 'react-icons/fa'

interface UserPanelProps {
  userEmail?: string | null
  userDisplayName?: string | null
  onNavigate?: (page: string) => void
  onSignOut?: () => void | Promise<void>
}

export default function UserPanel({ userEmail, userDisplayName, onNavigate, onSignOut }: UserPanelProps) {
  const [open, setOpen] = useState(false)
  const avatarLetter = useMemo(() => {
    const base = (userDisplayName || userEmail || 'U') || 'U'
    return base.charAt(0).toUpperCase()
  }, [userDisplayName, userEmail])

  if (userEmail) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur ring-1 ring-white/30 px-4 py-2 shadow-lg text-cyan-800 hover:bg-white/30"
        >
          <span className="inline-grid place-items-center size-8 rounded-full bg-cyan-100 text-cyan-700 font-bold">
            {avatarLetter}
          </span>
          <span className="font-semibold hidden sm:inline">{userDisplayName || userEmail}</span>
          {open ? <ChevronUpIcon className="size-5" /> : <ChevronDownIcon className="size-5" />}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white/80 backdrop-blur shadow-lg ring-1 ring-black/5 p-2">
            <button type="button" onClick={() => { onNavigate?.('accountSetting'); setOpen(false) }} className="w-full text-left rounded-xl px-3 py-2 text-cyan-800 hover:bg-cyan-50">Account Settings</button>
            <button type="button" onClick={() => { onNavigate?.('readingGoals'); setOpen(false) }} className="w-full text-left rounded-xl px-3 py-2 text-cyan-800 hover:bg-cyan-50">Reading Goals</button>
            <div className="mt-2 border-t border-gray-200 pt-2">
              <button type="button" onClick={async () => { await onSignOut?.(); setOpen(false) }} className="w-full text-left rounded-xl px-3 py-2 text-rose-600 hover:bg-rose-50">Log out</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur ring-1 ring-white/30 px-4 py-2 shadow-lg text-cyan-800 hover:bg-white/30"
      >
        <FaUserCircle className="size-6" />
        <span className="font-semibold hidden sm:inline">Guest</span>
        {open ? <ChevronUpIcon className="size-5" /> : <ChevronDownIcon className="size-5" />}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white/80 backdrop-blur shadow-lg ring-1 ring-black/5 p-2">
          <button
            type="button"
            onClick={() => { window.dispatchEvent(new CustomEvent('app:intent:accountSetting')); onNavigate?.('accountSetting'); setOpen(false) }}
            className="w-full text-left rounded-xl px-3 py-2 text-cyan-800 hover:bg-cyan-50"
          >
            Account Settings
          </button>
          <button type="button" onClick={() => { window.dispatchEvent(new CustomEvent('app:auth:open:signIn')); setOpen(false) }} className="w-full text-left rounded-xl px-3 py-2 text-cyan-800 hover:bg-cyan-50">Log in</button>
          <button type="button" onClick={() => { window.dispatchEvent(new CustomEvent('app:auth:open:signup')); setOpen(false) }} className="w-full text-left rounded-xl px-3 py-2 text-cyan-800 hover:bg-cyan-50">Sign up</button>
        </div>
      )}
    </div>
  )
}
