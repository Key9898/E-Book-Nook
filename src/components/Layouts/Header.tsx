import { useState, useEffect } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { textZoomGradientClass, TextAnimation } from './TextAnimation'
import Logo from '../../assets/logo/e-book-nook.svg'
import StickyLogo from '../../assets/logo/e-book-nook-one.svg'
import SignIn from '../Auth/SingIn'
import SignUp from '../Auth/SingUp'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { auth } from '../../firebaseConfig'
import UserPanel from '../Auth/UserPanel'
// useLocation မလိုတော့ပါ

interface HeaderProps {
  onNavigate?: (page: string) => void
}

const navigation = [
  { name: 'Collections', slug: 'collections' },
  { name: 'Reviews', slug: 'reviews' },
  { name: 'Our Story', slug: 'ourStory' },
]

export default function Header({ onNavigate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null)
  
  // isActive Logic တွေကို ဖယ်လိုက်ပါပြီ

  const handleSignOut = async () => {
    if (!(auth as any)?.app) {
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Auth not configured', message: 'Please set Firebase env variables.' } }))
      return
    }
    await signOut(auth)
    window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Signed out', message: 'You have been signed out.' } }))
  }

  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!(auth as any)?.app) return
    const unsub = onAuthStateChanged(auth, (user: User | null) => {
      const email = user?.email ?? null
      setUserEmail(email)
      setUserDisplayName(user?.displayName ?? (email ? email.split('@')[0] : null))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const openSignIn = () => { setAuthMode('signin'); setAuthOpen(true) }
    const openSignUp = () => { setAuthMode('signup'); setAuthOpen(true) }
    window.addEventListener('app:auth:open', openSignIn as any)
    window.addEventListener('app:auth:open:signin', openSignIn as any)
    window.addEventListener('app:auth:open:signIn', openSignIn as any)
    window.addEventListener('app:auth:open:signup', openSignUp as any)
    const onUserChanged = (e: any) => {
      const d = (e as CustomEvent).detail || {}
      if (typeof d.email === 'string') setUserEmail(d.email)
      if (typeof d.displayName === 'string') setUserDisplayName(d.displayName ?? (d.email ? d.email.split('@')[0] : null))
      else if (d.email && !d.displayName) setUserDisplayName(d.email.split('@')[0])
    }
    window.addEventListener('app:user:changed', onUserChanged as any)
    return () => {
      window.removeEventListener('app:auth:open', openSignIn as any)
      window.removeEventListener('app:auth:open:signin', openSignIn as any)
      window.removeEventListener('app:auth:open:signIn', openSignIn as any)
      window.removeEventListener('app:auth:open:signup', openSignUp as any)
      window.removeEventListener('app:user:changed', onUserChanged as any)
    }
  }, [])

  return (
    <header className={`sticky top-0 z-50 transition-colors duration-300 ${isSticky ? 'bg-gradient-to-b from-cyan-50 to-sky-100 shadow-md' : 'bg-white/30 backdrop-blur'}`}>
      <TextAnimation />
      <nav aria-label="Global" className="relative mx-auto flex max-w-7xl items-center justify-between p-6 px-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-x-3">
          <button
            type="button"
            onClick={() => { onNavigate?.('home') }}
            className="-m-1.5 p-1.5"
          >
            <span className="sr-only">E-Book Nook</span>
            <img
              alt="E-Book Nook Logo"
              src={isSticky ? StickyLogo : Logo}
              className="h-12 w-auto"
            />
          </button>
          {!isSticky && (
            <span className={`text-xl font-bold ${textZoomGradientClass}`}>
              E-Book Nook
            </span>
          )}
        </div>

        {/* Sticky: center the menu */}
        {isSticky && (
          <div className="hidden lg:flex lg:gap-x-12 absolute left-1/2 -translate-x-1/2">
            {navigation.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => { 
                   onNavigate?.(item.slug) 
                }}
                // Active Color Logic ဖြုတ်လိုက်ပါပြီ။ Hover effect ပဲ ထားပါတော့တယ်။
                className="text-base font-semibold text-cyan-600 hover:text-cyan-500 transition-colors"
              >
                {item.name}
              </button>
            ))}
          </div>
        )}

        {/* Non-sticky: put menu next to login on the right */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <div className="flex items-center gap-x-12">
            {!isSticky &&
              navigation.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => { onNavigate?.(item.slug) }}
                  // Active Color Logic ဖြုတ်လိုက်ပါပြီ။
                  className="text-base font-semibold text-cyan-800/80 hover:text-cyan-600 transition-colors"
                >
                  {item.name}
                </button>
              ))}

            <UserPanel userEmail={userEmail} userDisplayName={userDisplayName} onNavigate={onNavigate} onSignOut={handleSignOut} />
          </div>
        </div>

        <div className="flex lg:hidden items-center sm:gap-4">
          <UserPanel userEmail={userEmail} userDisplayName={userDisplayName} onNavigate={onNavigate} onSignOut={handleSignOut} />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex items-center justify-center p-2.5 text-gray-700"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-10" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gradient-to-b from-cyan-50 to-sky-100 p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { onNavigate?.('home'); setMobileMenuOpen(false) }}
              className="-m-1.5 p-1.5"
            >
              <span className="sr-only">E-Book Nook</span>
              <img alt="E-Book Nook Logo" src={isSticky ? StickyLogo : Logo} className="h-12 w-auto" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-xl shadow-lg p-2.5 text-gray-700"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-8" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                  onClick={() => { onNavigate?.(item.slug); setMobileMenuOpen(false) }}
                    className="-mx-3 block rounded-xl px-3 py-2 text-base sm:text-lg font-semibold sm:font-semibold w-full text-left text-cyan-600 hover:text-cyan-500 hover:bg-white/40"
                  >
                    {item.name}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Auth Modal */}
      <Dialog open={authOpen} onClose={setAuthOpen} className="relative z-50">
        <div className="fixed inset-0 bg-black/20" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md rounded-xl bg-white shadow-lg">
              {authMode === 'signin'
                ? <SignIn onClose={() => setAuthOpen(false)} onNavigate={onNavigate} />
                : <SignUp onBackToSignIn={() => setAuthMode('signin')} onClose={() => setAuthOpen(false)} onNavigate={onNavigate} />}
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </header>
  )
}