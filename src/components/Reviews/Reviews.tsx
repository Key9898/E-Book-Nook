import { useState, useEffect } from 'react'
import { StarIcon } from '@heroicons/react/20/solid'
import { UserCircleIcon } from '@heroicons/react/24/solid'
import Header from '../Layouts/Header'
import Footer from '../Layouts/Footer'
import ScrollToTopButton from '../Layouts/ScrollUpToTopButton'
import HeroBanner from '../Layouts/HeroBanner'
import Breadcrumb from '../Layouts/Breadcrumb'
import ReviewsPagination from './ReviewsPagination'
import ReviewsForm from './ReviewsForm'
import type { ReviewFormData } from './ReviewsForm'
import CountUp from 'react-countup'
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, type DocumentData, updateDoc, doc, increment } from 'firebase/firestore'
import { db, auth } from '../../firebaseConfig'
import { FaFilePdf } from 'react-icons/fa6'
import { LuFileAudio } from 'react-icons/lu'

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

interface ReviewsProps {
  onNavigate?: (page: string) => void
}

// Month name parsing
const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  auguest: 7, // tolerate typo
  september: 8,
  october: 9,
  november: 10,
  december: 11,
}

function parseReviewDate(dateStr?: string): number {
  if (!dateStr) return 0
  // ISO date (from <input type="date">): YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const t = new Date(dateStr).getTime()
    return Number.isNaN(t) ? 0 : t
  }
  // "Month DD, YYYY"
  const m = dateStr.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/)
  if (m) {
    const monthName = m[1].toLowerCase()
    const day = Number(m[2])
    const year = Number(m[3])
    const month = MONTHS[monthName]
    if (month !== undefined) {
      const t = new Date(year, month, day).getTime()
      return Number.isNaN(t) ? 0 : t
    }
  }
  // Fallback
  const t = new Date(dateStr).getTime()
  return Number.isNaN(t) ? 0 : t
}

export default function Reviews({ onNavigate }: ReviewsProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [featured, setFeatured] = useState(() => {
    const saved = localStorage.getItem('eh_featured_reviews')
    if (saved) {
      try {
        const list = JSON.parse(saved)
        // Form submissions only: ISO date from <input type="date">
        return Array.isArray(list)
          ? list.filter((r: { date?: string }) => typeof r?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date))
          : []
      } catch {
        return []
      }
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem('eh_featured_reviews', JSON.stringify(featured))
  }, [featured])

  useEffect(() => {
    if (!db) return
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: any[] = []
        snap.forEach((doc) => {
          const data = doc.data() as DocumentData
          list.push({
            id: doc.id,
            rating: Number(data.rating) || 0,
            content: `<p>${String(data.text || data.content || '')}</p>`,
            author: String(data.userName || data.author || ''),
            country: String(data.country || ''),
            bookType: String(data.bookType || ''),
            date: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : String(data.date || ''),
            commentCount: Number(data.commentCount || 0),
            avatarSrc: typeof data.avatarDataUrl === 'string' ? data.avatarDataUrl : null,
          })
        })
        setFeatured(list)
      },
      () => {
        window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Failed to load reviews' } }))
      }
    )
    return () => unsub()
  }, [])

  const handleAddReview = async (data: ReviewFormData) => {
    const user = auth?.currentUser || null
    if (!user) {
      window.dispatchEvent(new CustomEvent('app:auth:open'))
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Login required', message: 'Please log in to submit a review.' } }))
      return
    }
    if (db) {
      try {
        await addDoc(collection(db, 'reviews'), {
          text: data.content,
          rating: data.rating,
          country: data.country,
          bookType: data.bookType,
          userId: user.uid,
          userName: user.displayName || data.fullName || (user.email ? user.email.split('@')[0] : ''),
          avatarDataUrl: data.avatarDataUrl || null,
          createdAt: serverTimestamp(),
          commentCount: 0,
        })
        try {
          await addDoc(collection(db, 'notifications'), {
            type: 'personal',
            to: user.uid,
            title: 'Review submitted',
            message: 'Your review was published successfully.',
            read: false,
            createdAt: serverTimestamp(),
          })
        } catch {}
        setIsFormOpen(false)
        window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Review submitted', message: 'Thank you for sharing your experience.' } }))
      } catch (e) {
        window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Submit failed', message: 'Could not save review. Please try again.' } }))
      }
    }
  }

  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [openCommentsReviewId, setOpenCommentsReviewId] = useState<string | null>(null)
  const [activeComments, setActiveComments] = useState<{ id: string; userName: string; text: string; createdAt?: string }[]>([])

  const addComment = async (reviewId: string) => {
    const text = (commentInputs[reviewId] || '').trim()
    if (!text) return
    const user = auth?.currentUser || null
    if (!user || !db) {
      window.dispatchEvent(new CustomEvent('app:auth:open'))
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Login required', message: 'Please log in to comment.' } }))
      return
    }
    try {
      await updateDoc(doc(db, 'reviews', reviewId), { commentCount: increment(1) })
      try {
        const rawName = String(user.displayName || user.email || '')
        const nameOnly = rawName.includes('@') ? rawName.split('@')[0] : rawName
        await addDoc(collection(db, 'reviews', reviewId, 'comments'), {
          text,
          userId: user.uid,
          userName: nameOnly,
          createdAt: serverTimestamp(),
        })
        try {
          await addDoc(collection(db, 'notifications'), {
            type: 'personal',
            to: user.uid,
            title: 'Comment added',
            message: 'Your comment was posted successfully.',
            read: false,
            createdAt: serverTimestamp(),
          })
        } catch {}
      } catch {}
      setCommentInputs((s) => ({ ...s, [reviewId]: '' }))
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Comment added' } }))
    } catch {
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Failed to add comment' } }))
    }
  }

  useEffect(() => {
    if (!openCommentsReviewId || !db) return
    const q = query(collection(db, 'reviews', openCommentsReviewId, 'comments'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: { id: string; userName: string; text: string; createdAt?: string }[] = []
        snap.forEach((d) => {
          const data = d.data() as DocumentData
          const rawName = String((data as any).userName || '')
          const nameOnly = rawName.includes('@') ? rawName.split('@')[0] : rawName
          list.push({
            id: d.id,
            userName: nameOnly,
            text: String(data.text || ''),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
          })
        })
        setActiveComments(list)
      },
      () => { setActiveComments([]) }
    )
    return () => unsub()
  }, [openCommentsReviewId, db])

  // Month name parsing (typo 'Auguest' ကိုလည်းလက်ခံ)
  // Sort by date (newest → oldest)
  const featuredSorted = [...featured].sort(
    (a, b) => parseReviewDate(b.date) - parseReviewDate(a.date)
  )

  // Reviews data for pagination
  const filteredFiles = featuredSorted

  // Calculate pagination
  const totalItems = filteredFiles.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredFiles.slice(startIndex, endIndex)

  // Real-time review stats (derived from featured)
  const totalCount = featuredSorted.length
  const averageRating = totalCount
    ? featuredSorted.reduce((sum, r) => sum + r.rating, 0) / totalCount
    : 0
  const countsByRating = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: featuredSorted.filter((rev) => rev.rating === r).length,
  }))

  return (
    <>
      <Header onNavigate={onNavigate} />
      <HeroBanner
        onPrimaryAction={() => onNavigate?.('reviews')}
        title="Hear From Our Reading Community"
        description="See what fellow book lovers are saying. Discover new favoritess, get recommendations, and learn how our community uses E-Book Nook to read, listen, and grow."
        buttonText="Explore Reviews"
        backgroundImgAlt="Guest stories banner"
        preTitleSlot={<Breadcrumb pages={[{ name: 'Reviews', href: '#reviews', current: true }]} onNavigate={onNavigate} variant="dark" />}
        scrollTargetId="reviews-content"
      />

      {/* Section Header */}
      <div id="reviews-content" className="mx-auto max-w-7xl px-5 sm:px-9 lg:px-8 pt-20 pb-12 lg:pt-24 lg:pb-16 border-b border-slate-200">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-cyan-600">
            Stories From Our Readers
          </h2>
          <p className="mt-3 text-lg/8 text-slate-700 max-w-3xl mx-auto">
            The best recommendations come from fellow book lovers. See what our community is reading and get inspired to find your next great story.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-2xl px-5 py-16 sm:px-9 sm:max-w-7xl sm:px-6 sm:py-16 lg:grid lg:max-w-7xl lg:grid-cols-12 lg:gap-x-8 lg:px-8 lg:py-16">
        <div className="lg:col-span-4">
          <h2 className="text-2xl font-bold tracking-tight text-cyan-700/80">Reader Reviews</h2>

          <div className="mt-3 flex items-center">
            <div>
              <div className="flex items-center">
                {[0, 1, 2, 3, 4].map((rating) => (
                  <StarIcon
                    key={rating}
                    aria-hidden="true"
                    className={classNames(
                      averageRating > rating ? 'text-yellow-400' : 'text-slate-300',
                      'size-5 shrink-0',
                    )}
                  />
                ))}
              </div>
              <p className="sr-only">{averageRating} out of 5 stars</p>
            </div>
            <p className="ml-2 text-sm text-slate-900">Based on {totalCount} reviews</p>
          </div>

          <div className="mt-6">
            <h3 className="sr-only">Review data</h3>

            <dl className="space-y-3">
              {countsByRating.map((count) => (
                <div key={count.rating} className="flex items-center text-sm">
                  <dt className="flex flex-1 items-center">
                    <p className="w-3 font-medium text-slate-900">
                      {count.rating}
                      <span className="sr-only"> star reviews</span>
                    </p>
                    <div aria-hidden="true" className="ml-1 flex flex-1 items-center">
                      <StarIcon
                        aria-hidden="true"
                        className={classNames(count.count > 0 ? 'text-yellow-400' : 'text-slate-300', 'size-5 shrink-0')}
                      />
                      <div className="relative ml-3 flex-1">
                        <div className="h-3 rounded-full border border-slate-200 bg-slate-100" />
                        {count.count > 0 ? (
                          <div
                            style={{ width: `calc(${count.count} / ${totalCount} * 100%)` }}
                            className="absolute inset-y-0 rounded-full border border-yellow-400 bg-yellow-400"
                          />
                        ) : null}
                      </div>
                    </div>
                  </dt>
                  <dd className="ml-3 w-12 text-right text-sm text-slate-900 tabular-nums">
                    <CountUp
                      end={totalCount > 0 ? Math.round((count.count / totalCount) * 100) : 0}
                      duration={1.2}
                      suffix="%"
                      enableScrollSpy
                      scrollSpyOnce
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-10">
            <h3 className="text-xl font-medium text-cyan-600">Share Your Thoughts</h3>
            <p className="mt-1 text-base text-slate-700">
              Just finished a book from our collection? We'd be grateful to hear your experience. Your review helps other readers discover their next great read.
            </p>

            <button
              type="button"
              onClick={() => { if (auth?.currentUser) { setIsFormOpen(true) } else { window.dispatchEvent(new CustomEvent('app:auth:open')); window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Login required', message: 'Please log in to write a review.' } })) } }}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl shadow-lg border border-slate-300 bg-slate-50 px-8 py-2 text-base font-medium text-slate-900 hover:bg-cyan-700 hover:text-white sm:w-auto lg:w-full"
            >
              Write a review
            </button>
          </div>
        </div>

        <div className="mt-16 lg:col-span-7 lg:col-start-6 lg:mt-0">
          <h3 className="sr-only">Recent reviews</h3>

          <div className="flow-root">
            <div className="-my-12 divide-y divide-slate-200">
              {currentItems.map((review) => {
                const displayAuthor = review.author
                const origin = review.country
                const bt = String(review.bookType || '')
                const baseTitle = bt.replace(/\s*\((PDF|Audiobook)\)\s*$/, '')
                const isPdf = /\(PDF\)$/.test(bt)
                const isAudio = /\(Audiobook\)$/.test(bt)

                return (
                  <div key={review.id} className="py-12">
                    <div className="flex items-center">
                      {typeof review.avatarSrc === 'string' && review.avatarSrc.trim() ? (
                        <img
                          alt={`${review.author}.`}
                          src={review.avatarSrc}
                          className="size-12 rounded-xl"
                        />
                      ) : (
                        <div className="size-12 rounded-xl bg-slate-100 flex items-center justify-center">
                          <UserCircleIcon className="size-8 text-slate-400" />
                        </div>
                      )}
                      <div className="ml-4 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h4 className="text-base font-bold text-slate-900">{displayAuthor}</h4>
                          {origin ? (
                            <span className="inline-flex items-center rounded-xl bg-cyan-50 hover:cyan-100 px-2.5 py-1 text-base font-medium text-slate-700">
                              {origin}
                            </span>
                          ) : null}
                          {bt ? (
                            <span className="inline-flex items-center rounded-xl bg-cyan-50 hover:cyan-100 px-2.5 py-1 text-base font-medium text-slate-700">
                              {isPdf ? <FaFilePdf aria-hidden className="mr-1 size-4 text-slate-700" /> : null}
                              {isAudio ? <LuFileAudio aria-hidden className="mr-1 size-4 text-slate-700" /> : null}
                              {baseTitle}
                            </span>
                          ) : null}
                          <button type="button" onClick={() => setOpenCommentsReviewId(review.id)} className="inline-flex items-center rounded-xl bg-cyan-50 px-2.5 py-1 text-base font-medium text-slate-700">Comments: {review.commentCount ?? 0}</button>
                        </div>

                        <div className="mt-1 flex items-center">
                          {[0, 1, 2, 3, 4].map((rating) => (
                            <StarIcon
                              key={rating}
                              aria-hidden="true"
                              className={classNames(
                                review.rating > rating ? 'text-yellow-400' : 'text-slate-300',
                                'size-5 shrink-0',
                              )}
                            />
                          ))}
                          {review.date ? (
                            <span className="ml-3 text-base text-slate-700 leading-5">{review.date}</span>
                          ) : null}
                        </div>
                        <p className="sr-only">{review.rating} out of 5 stars</p>
                      </div>
                    </div>

                    <div
                      dangerouslySetInnerHTML={{ __html: review.content }}
                      className="mt-4 space-y-6 text-base text-slate-700"
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={commentInputs[review.id] ?? ''}
                        onChange={(e) => setCommentInputs((s) => ({ ...s, [review.id]: e.target.value }))}
                        placeholder="Write a comment..."
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />
                      <button type="button" onClick={() => addComment(review.id)} className="rounded-xl bg-cyan-700 px-3 py-2 text-base text-white hover:bg-cyan-600">Comment</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <ReviewsPagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage}
        totalPosts={filteredFiles.length} 
        postsPerPage={itemsPerPage} 
      />

      {/* Popup form (move inside the component) */}
      <ReviewsForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddReview}
      />

      {openCommentsReviewId && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpenCommentsReviewId(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-lg sm:max-w-xl rounded-xl bg-white shadow-lg">
              <div className="px-4 sm:px-6 py-3 border-b border-slate-200/60 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Comments</h3>
                <button type="button" onClick={() => setOpenCommentsReviewId(null)} className="rounded-xl px-3 py-1 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200">Close</button>
              </div>
              <div className="px-4 py-4 sm:px-6 sm:py-6">
                {activeComments.length === 0 ? (
                  <p className="text-sm text-slate-600">No comments yet</p>
                ) : (
                  <ul className="space-y-3">
                    {activeComments.map((c) => (
                      <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900">{c.userName}</span>
                          {c.createdAt ? <span className="text-xs text-slate-500">{c.createdAt}</span> : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{c.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ScrollToTopButton />
      <Footer onNavigate={onNavigate} />
    </>
  )
}
