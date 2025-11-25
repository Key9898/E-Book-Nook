import { useState, useEffect } from 'react'
import Notify from './components/Layouts/Notify'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './firebaseConfig'
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
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
    const saved = typeof window !== 'undefined' ? localStorage.getItem('current_page') : null
    return hash || saved || 'home'
  })

  // Sync current page to URL hash and localStorage
  useEffect(() => {
    if (!currentPage) return
    if (currentPage === 'home') {
      // Clear hash for home to keep root clean
      history.replaceState(null, '', window.location.pathname)
    } else {
      const nextHash = `#${currentPage}`
      if (window.location.hash !== nextHash) {
        history.replaceState(null, '', `${window.location.pathname}${nextHash}`)
      }
    }
    localStorage.setItem('current_page', currentPage)
  }, [currentPage])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [currentPage])

  // React to manual hash changes (e.g., reload with hash, back/forward)
  useEffect(() => {
    const onHashChange = () => {
      const page = window.location.hash.replace('#', '') || 'home'
      setCurrentPage(page)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
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
      setCurrentPage('home')
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
      setCurrentPage(lastPageBeforeAuth || 'home')
      setAccountSettingIntent(false)
      setLastPageBeforeAuth(null)
    }
  }, [currentUser])

  const renderPage = () => {
    switch (currentPage) {
      case 'accountSetting':
        return currentUser ? (
          <AccountMain onNavigate={setCurrentPage} />
        ) : accountSettingIntent ? (
          <>
            <Header onNavigate={setCurrentPage} />
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
          <HeroSection onNavigate={setCurrentPage} />
        )
      case 'readingGoals':
        return currentUser ? <ReadingGoals onNavigate={setCurrentPage} /> : <HeroSection onNavigate={setCurrentPage} />
      case 'collections':
        return <Collections onNavigate={setCurrentPage} />
        case 'pdfBooks':
        return <PdfBooks onNavigate={setCurrentPage} />
        case 'audiobooks':
        return <Audiobooks onNavigate={setCurrentPage} />
        case 'reviews':
        return <Reviews onNavigate={setCurrentPage} />
        case 'ourStory':
        return <OurStory onNavigate={setCurrentPage} />
        case 'feedbacks':
        return <Feedbacks onNavigate={setCurrentPage} />
        case 'faqs':
        return <FAQs onNavigate={setCurrentPage} />
        case 'termsOfService':
        return <TermsOfService onNavigate={setCurrentPage} />
        case 'privacyPolicy':
        return <PrivacyPolicy onNavigate={setCurrentPage} />
      default:
        return <HeroSection onNavigate={setCurrentPage} />
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
