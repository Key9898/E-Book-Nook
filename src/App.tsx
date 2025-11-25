import { useState, useEffect } from 'react'
import Notify from './components/Layouts/Notify'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth, db } from './firebaseConfig'
import AccountMain from './components/Account/AccountMain'
import ReadingGoals from './components/ReadingGoals/ReadingGoals'
import Header from './components/Layouts/Header'
import HeroSection from './components/HeroSection/HeroSection'
import Collections from './components/Collections/Collections'
import PdfBooks from './components/Collections/PdfBooks/PdfBooks'
import Audiobooks from './components/Collections/AudioBooks/AudioBooks'
import Reviews from './components/Reviews/Reviews'
import OurStory from './components/OurStory/OurStory'
import Feedbacks from './components/Feedbacks/Feedbacks'
import FAQs from './components/FAQs/FAQs'
import TermsOfService from './components/TermsOfService/TermsOfService'
import PrivacyPolicy from './components/PrivacyPolicy/PrivacyPolicy'

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
    const saved = typeof window !== 'undefined' ? localStorage.getItem('current_page') : null
    if (path === '/admin-panel') return 'adminPanel'
    return hash || saved || 'home'
  })

  // ✅ NEW: Navigate Function with URL Fix
  const handleNavigate = (slug: string) => {
    // Admin Panel ကနေ ထွက်ရင် URL ကို အရင်ရှင်းမယ်
    if (window.location.pathname === '/admin-panel') {
      window.history.pushState({}, '', `/#${slug}`)
    } else {
      window.location.hash = slug
    }
    setCurrentPage(slug)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  // Sync current page to URL and localStorage
  useEffect(() => {
    if (!currentPage) return
    if (currentPage === 'home') {
      history.replaceState(null, '', window.location.pathname)
    } else if (currentPage === 'adminPanel') {
      if (window.location.pathname !== '/admin-panel') {
        history.replaceState(null, '', '/admin-panel')
      }
    } else {
      const nextHash = `#${currentPage}`
      if (window.location.hash !== nextHash) {
        history.replaceState(null, '', `${window.location.pathname}${nextHash}`)
      }
    }
    localStorage.setItem('current_page', currentPage)
  }, [currentPage])

  // React to manual URL changes (hash/back/forward)
  useEffect(() => {
    const onHashChange = () => {
      const page = window.location.hash.replace('#', '') || 'home'
      setCurrentPage(page)
    }
    const onPopState = () => {
      const path = window.location.pathname
      if (path === '/admin-panel') setCurrentPage('adminPanel')
      else if (!window.location.hash) setCurrentPage('home')
    }
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('popstate', onPopState)
    return () => { window.removeEventListener('hashchange', onHashChange); window.removeEventListener('popstate', onPopState) }
  }, [])

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [accountSettingIntent, setAccountSettingIntent] = useState(false)
  const [lastPageBeforeAuth, setLastPageBeforeAuth] = useState<string | null>(null)

  useEffect(() => {
    if (!(auth as any)?.app) return
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!currentUser && currentPage === 'readingGoals') {
      handleNavigate('home')
    }
  }, [currentUser, currentPage])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('auth_user', currentUser.uid)
    } else {
      localStorage.removeItem('auth_user')
    }
  }, [currentUser])

  useEffect(() => {
    const handler = () => { setLastPageBeforeAuth(currentPage); setAccountSettingIntent(true) }
    window.addEventListener('app:intent:accountSetting', handler as any)
    return () => window.removeEventListener('app:intent:accountSetting', handler as any)
  }, [currentPage])

  useEffect(() => {
    if (currentPage !== 'accountSetting') setAccountSettingIntent(false)
  }, [currentPage])

  useEffect(() => {
    if (currentUser && accountSettingIntent && currentPage === 'accountSetting') {
      handleNavigate(lastPageBeforeAuth || 'home')
      setAccountSettingIntent(false)
      setLastPageBeforeAuth(null)
    }
  }, [currentUser])

  const renderPage = () => {
    switch (currentPage) {
      case 'adminPanel': {
        const isAdmin = (auth?.currentUser?.email || '').toLowerCase() === 'key.w.aung.dev@gmail.com'
        if (!isAdmin) {
          return (
            <>
              <Header onNavigate={handleNavigate} />
              <div className="min-h-[calc(100vh-4rem)] grid place-items-center bg-gradient-to-br from-slate-900/80 via-cyan-900/80 to-sky-900/80">
                <div className="max-w-xl w-full rounded-xl bg-white/40 backdrop-blur p-8 text-center shadow-xl ring-1 ring-white/30">
                  <h2 className="text-2xl font-semibold text-slate-900">Page Not Found</h2>
                  <p className="mt-2 text-slate-700">The page you’re looking for doesn’t exist.</p>
                  <button type="button" onClick={() => handleNavigate('home')} className="mt-6 px-6 py-3 bg-cyan-700 text-white rounded-xl shadow-lg hover:bg-cyan-600">Go Home</button>
                </div>
              </div>
            </>
          )
        }
        return (
          <>
            <Header onNavigate={handleNavigate} />
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
              <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
              <p className="mt-1 text-slate-700">Send system notifications to all users.</p>
              <form className="mt-6 grid gap-4" onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget as HTMLFormElement)
                const category = String(fd.get('category') || '')
                const title = String(fd.get('title') || '')
                const message = String(fd.get('message') || '')
                
                try {
                  if (!auth?.currentUser || !auth?.currentUser?.email) throw new Error('not_auth')
                  if (!db) throw new Error('no_db')
                  
                  const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
                  
                  await addDoc(collection(db, 'notifications'), {
                    type: 'system',
                    category,
                    title,
                    message,
                    read: false,
                    readBy: [],
                    createdAt: serverTimestamp(),
                  })
                  
                  window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Notification sent', message: 'System notification has been dispatched.' } }))
                  ;(e.currentTarget as HTMLFormElement).reset()
                  
                } catch (err) {
                  // ✅ NEW: Error Logging for debugging
                  console.error("REAL ERROR:", err);
                  window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Send failed', message: 'Could not send notification.' } }))
                }
              }}>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-900">Category</label>
                  <select id="category" name="category" className="mt-2 block w-full rounded-xl bg-white px-3 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-300">
                    <option value="maintenance">Maintenance Alerts</option>
                    <option value="new_content">New Features/Content</option>
                    <option value="recommendations">Recommendations</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-900">Title</label>
                  <input id="title" name="title" type="text" required className="mt-2 block w-full rounded-xl bg-white px-3 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-300" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-900">Message</label>
                  <textarea id="message" name="message" required rows={4} className="mt-2 block w-full rounded-xl bg-white px-3 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-300" />
                </div>
                <div>
                  <button type="submit" className="rounded-xl bg-cyan-700 px-4 py-2 text-white font-semibold shadow-lg hover:bg-cyan-600">Send to all users</button>
                </div>
              </form>
            </div>
          </>
        )
      }
      case 'accountSetting':
        return currentUser ? (
          <AccountMain onNavigate={handleNavigate} />
        ) : accountSettingIntent ? (
          <>
            <Header onNavigate={handleNavigate} />
            <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900/80 via-cyan-900/80 to-sky-900/80 flex items-center justify-center">
              <div className="max-w-xl w-full rounded-xl bg-white/40 backdrop-blur p-8 text-center shadow-xl ring-1 ring-white/30">
                <div className="mx-auto mb-4 size-12 rounded-full bg-white/50 grid place-items-center">
                  <svg viewBox="0 0 24 24" className="size-8 text-slate-700"><path fill="currentColor" d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-3.866 0-7 3.134-7 7h14c0-3.866-3.134-7-7-7Z"/></svg>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">Login Required</h2>
                <p className="mt-2 text-slate-700">Please login to view your profile information.</p>
                <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('app:auth:open'))} className="mt-6 px-6 py-3 bg-cyan-700 text-white rounded-xl shadow-lg hover:bg-cyan-600 transition-colors">Login</button>
              </div>
            </div>
          </>
        ) : (
          <HeroSection onNavigate={handleNavigate} />
        )
      case 'readingGoals':
        return currentUser ? <ReadingGoals onNavigate={handleNavigate} /> : <HeroSection onNavigate={handleNavigate} />
      case 'collections':
        return <Collections onNavigate={handleNavigate} />
        case 'pdfBooks':
        return <PdfBooks onNavigate={handleNavigate} />
        case 'audiobooks':
        return <Audiobooks onNavigate={handleNavigate} />
        case 'reviews':
        return <Reviews onNavigate={handleNavigate} />
        case 'ourStory':
        return <OurStory onNavigate={handleNavigate} />
        case 'feedbacks':
        return <Feedbacks onNavigate={handleNavigate} />
        case 'faqs':
        return <FAQs onNavigate={handleNavigate} />
        case 'termsOfService':
        return <TermsOfService onNavigate={handleNavigate} />
        case 'privacyPolicy':
        return <PrivacyPolicy onNavigate={handleNavigate} />
      default:
        return <HeroSection onNavigate={handleNavigate} />
    }
  }

  return (
    <>
      {renderPage()}
      <Notify />
    </>
  )
}

export default App