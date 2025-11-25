import { useState, useRef, useEffect } from 'react'
import { XMarkIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import Logo from '../../assets/logo/e-book-nook.svg'
import { auth } from '../../firebaseConfig'

export type ReviewFormData = {
  fullName: string
  country: string
  rating: number
  content: string
  date: string
  bookType?: string
  avatarFile?: File | null
  avatarDataUrl?: string | null
}

interface ReviewsFormProps {
  open: boolean
  onClose: () => void
  onSubmit?: (data: ReviewFormData) => void
}

export default function ReviewsForm({ open, onClose, onSubmit }: ReviewsFormProps) {
  if (!open) return null

  const [fullName, setFullName] = useState('')
  const [country, setCountry] = useState('')
  const [bookType, setBookType] = useState('')
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarFileRef = useRef<File | null>(null)
  const [date, setDate] = useState('')

  useEffect(() => {
    const u = auth?.currentUser || null
    const name = u?.displayName || (u?.email ? u.email.split('@')[0] : '')
    if (name) setFullName(name)
    const today = new Date().toISOString().split('T')[0]
    setDate(today)
  }, [open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    avatarFileRef.current = file
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setAvatarPreview(null)
    }
  }

  const PDF_OPTIONS = [
    'Introduction to Computer Science (PDF)',
    'Reading with COC Formula (PDF)',
    'Introduction to Python Programming (PDF)'
  ]
  const AUDIO_OPTIONS = [
    'Cocoa Break Collection (Audiobook)',
    'Six Little Girls (Audiobook)'
  ]
  const isPdfSelected = PDF_OPTIONS.includes(bookType)
  const isAudioSelected = AUDIO_OPTIONS.includes(bookType)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: ReviewFormData = {
      fullName,
      country,
      bookType,              
      rating,
      content,
      date,
      avatarFile: avatarFileRef.current ?? null,
      avatarDataUrl: avatarPreview ?? null,
    }
    onSubmit?.(payload)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg sm:max-w-xl rounded-xl bg-white shadow-lg">
          {/* Header */}
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <img src={Logo} alt="The Evergreen Hill logo" className="size-6 sm:size-7" />
                <h3 className="text-xl font-semibold text-slate-900">Write a Review</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>
            {/* separator that matches body width */}
            <div className="border-b border-slate-200/60" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-4 py-4 sm:px-6 sm:py-6">
            {/* Avatar + Name (inline) */}
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="size-16 rounded-xl object-cover" />
              ) : (
                <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <UserCircleIcon className="size-10 text-slate-400" />
                </div>
              )}
              <div className="flex-1">
                <label htmlFor="full-name" className="block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  id="full-name"
                  type="text"
                  required
                  value={fullName}
                  readOnly
                  aria-readonly="true"
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:outline-none"
                  placeholder="Your Full Name"
                />
              </div>
            </div>
            {/* City or Country */}
            <div className="mt-4 sm:mt-6">
              <label htmlFor="country" className="block text-sm font-medium text-slate-700">City or Country</label>
              <input
                id="country"
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:outline-none"
                placeholder="e.g., Yangon or Myanmar"
              />
            </div>
            {/* Book Types */}
            <input type="hidden" value={bookType} required />
            <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="bookTypePdf" className="block text-sm font-medium text-slate-700">PDF Books</label>
                <select
                  id="bookTypePdf"
                  value={isPdfSelected ? bookType : ""}
                  onChange={(e) => setBookType(e.target.value)}
                  disabled={isAudioSelected}
                  className="block w-full rounded-xl bg-white px-3.5 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-300 placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600"
                >
                  <option value="">Select PDF Book</option>
                  <option value="Introduction to Computer Science (PDF)">Introduction to Computer Science</option>
                  <option value="Reading with COC Formula (PDF)">Reading with COC Formula</option>
                  <option value="Introduction to Python Programming (PDF)">Introduction to Python Programming</option>
                </select>
              </div>
              <div>
                <label htmlFor="bookTypeAudio" className="block text-sm font-medium text-slate-700">Audiobooks</label>
                <select
                  id="bookTypeAudio"
                  value={isAudioSelected ? bookType : ""}
                  onChange={(e) => setBookType(e.target.value)}
                  disabled={isPdfSelected}
                  className="block w-full rounded-xl bg-white px-3.5 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-300 placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600"
                >
                  <option value="">Select audiobook</option>
                  <option value="Cocoa Break Collection (Audiobook)">Cocoa Break Collection</option>
                  <option value="Six Little Girls (Audiobook)">Six Little Girls</option>
                </select>
              </div>
            </div>
            {/* Rating + Date */}
            <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-slate-700">Rating</label>
                <select
                  id="rating"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-cyan-600 focus:outline-none"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} stars
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700">Date</label>
                <input
                  id="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-cyan-600 focus:outline-none"
                />
              </div>
            </div>
            {/* Content */}
            <div className="mt-4 sm:mt-6">
              <label htmlFor="content" className="block text-sm font-medium text-slate-700">Your Review</label>
              <textarea
                id="content"
                rows={5}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:outline-none"
                placeholder="Share your experience..."
              />
            </div>
            {/* Optional photo upload */}
            <div className="mt-4 sm:mt-6">
              <label htmlFor="avatar" className="block text-sm font-medium text-slate-700">Choose your photo (optional)</label>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
              />
            </div>
            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600"
              >
                Submit Review
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
