import { useState } from 'react'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../firebaseConfig'
import Logo from '../../assets/logo/e-book-nook.svg'
import SignUp from './SingUp'
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function SignIn({ onClose, onNavigate }: { onClose?: () => void, onNavigate?: (page: string) => void }) {
  const [showSignUp, setShowSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (showSignUp) {
    return <SignUp onBackToSignIn={() => setShowSignUp(false)} onClose={onClose} onNavigate={onNavigate} />
  }
  return (
    <>
      <div className="relative flex min-h-full flex-col justify-center py-6 sm:px-6 lg:px-8">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-xl shadow-lg p-1 text-slate-500 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
          aria-label="Close"
        >
          <XMarkIcon className="size-6" aria-hidden="true" />
        </button>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            alt="Heavenly Flowers"
            src={Logo}
            className="mx-auto h-14 w-auto"
          />
          <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-cyan-700/80">
            Login to your account
          </h2>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-[400px]">
          <div className="bg-white px-4 py-6 shadow-sm sm:rounded-xl shadow-lg sm:px-6">
            <form action="#" method="POST" className="space-y-4" onSubmit={async (e) => {
              e.preventDefault()
              const form = e.currentTarget as HTMLFormElement
              const fd = new FormData(form)
              const email = String(fd.get('email') || '')
              const password = String(fd.get('password') || '')
              const remember = fd.get('remember-me') !== null
              if (!auth || !(auth as any).app) {
                window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Auth not configured', message: 'Please set Firebase env variables.' } }))
                return
              }
              try {
                await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
                await signInWithEmailAndPassword(auth, email, password)
                window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Signed in', message: 'Welcome back to E-Book Nook.' } }))
                onClose?.()
              } catch (err: any) {
                let msg = 'Sign in failed. Please try again.'
                switch (err?.code) {
                  case 'auth/invalid-credential':
                  case 'auth/wrong-password':
                    msg = 'Email or password is incorrect.'
                    break
                  case 'auth/user-not-found':
                    msg = 'No account found with this email.'
                    break
                  case 'auth/invalid-email':
                    msg = 'Enter a valid email address.'
                    break
                  case 'auth/too-many-requests':
                    msg = 'Too many attempts. Try again later.'
                    break
                  case 'auth/user-disabled':
                    msg = 'This account has been disabled.'
                    break
                  case 'auth/operation-not-allowed':
                    msg = 'Email/Password sign-in is disabled. Enable it in Firebase Authentication.'
                    break
                  default:
                    break
                }
                console.error('[SignIn] Error:', err?.code || err)
                window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Sign in error', message: msg } }))
              }
            }}>
              <div>
                <label htmlFor="email" className="block text-sm/6 font-medium text-slate-900">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    autoComplete="email"
                    className="block w-full rounded-xl shadow-lg bg-white px-3 py-1.5 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-300 placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-700/80 sm:text-sm/6"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm/6 font-medium text-slate-900">
                  Password
                </label>
                <div className="mt-2 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="block w-full rounded-xl shadow-lg bg-white pr-10 px-3 py-1.5 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-300 placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-700/80 sm:text-sm/6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-2 flex items-center rounded-xl px-2 text-slate-500 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
                  >
                    {showPassword ? <EyeSlashIcon className="size-5" aria-hidden="true" /> : <EyeIcon className="size-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <div className="flex h-6 shrink-0 items-center">
                    <div className="group grid size-4 grid-cols-1">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="col-start-1 row-start-1 appearance-none rounded-sm border border-slate-300 bg-white checked:border-cyan-700/80 checked:bg-cyan-700/80 indeterminate:border-cyan-700/80 indeterminate:bg-cyan-700/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700/80 disabled:border-slate-300 disabled:bg-slate-100 disabled:checked:bg-slate-100 forced-colors:appearance-auto"
                      />
                      <svg
                        fill="none"
                        viewBox="0 0 14 14"
                        className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-slate-950/25"
                      >
                        <path
                          d="M3 8L6 11L11 3.5"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-0 group-has-checked:opacity-100"
                        />
                        <path
                          d="M3 7H11"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-0 group-has-indeterminate:opacity-100"
                        />
                      </svg>
                    </div>
                  </div>
                  <label htmlFor="remember-me" className="block text-sm/6 text-slate-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm/6">
                <button
                  type="button"
                  onClick={async () => {
                    if (!auth || !(auth as any).app) {
                      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Auth not configured', message: 'Please set Firebase env variables.' } }))
                      return
                    }
                    const emailInput = document.getElementById('email') as HTMLInputElement | null
                    const emailVal = emailInput?.value?.trim() || ''
                    if (!emailVal) {
                      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Enter email', message: 'Please enter your email to reset password.' } }))
                      return
                    }
                  try {
                    await sendPasswordResetEmail(auth, emailVal)
                    window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Email sent', message: 'Password reset email has been sent.' } }))
                    try {
                      const adminForm = new FormData()
                      adminForm.append('name', 'Password Reset Request')
                      adminForm.append('email', emailVal)
                      adminForm.append('message', `A user requested a password reset.\nEmail: ${emailVal}\nTime: ${new Date().toISOString()}\nUser-Agent: ${navigator.userAgent}`)
                      adminForm.append('_subject', 'E-Book Nook: Password Reset Requested')
                      const res = await fetch('https://formspree.io/f/xzzyddlr', { method: 'POST', body: adminForm, headers: { Accept: 'application/json' } })
                      if (res.ok) {
                        window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Admin notified', message: 'We have notified the developer about your reset request.' } }))
                      } else {
                        window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'warning', title: 'Partial success', message: 'Reset email sent. Developer notification could not be delivered.' } }))
                      }
                    } catch {
                      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'warning', title: 'Partial success', message: 'Reset email sent. Developer notification failed.' } }))
                    }
                  } catch (err: any) {
                    let msg = 'Could not send reset email.'
                    switch (err?.code) {
                      case 'auth/user-not-found': msg = 'No account found with this email.'; break
                      case 'auth/invalid-email': msg = 'Enter a valid email address.'; break
                        default: break
                      }
                      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Reset failed', message: msg } }))
                    }
                  }}
                  className="font-semibold text-cyan-700 hover:text-cyan-600"
                >
                  Forgot password?
                </button>
              </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="rounded-xl shadow-lg bg-cyan-700/80 px-3 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-cyan-600/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 transition-all duration-200 transform hover:scale-105 w-full"
                >
                  Login
                </button>
              </div>
            </form>

            <div>
              <div className="mt-6 flex items-center gap-x-4">
                <div className="w-full flex-1 border-t border-slate-200" />
                <p className="text-sm font-medium text-nowrap text-cyan-700">Or continue with</p>
                <div className="w-full flex-1 border-t border-slate-200" />
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={async () => {
                    if (!auth || !(auth as any).app) {
                      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Auth not configured', message: 'Please set Firebase env variables.' } }))
                      return
                    }
                    try {
                      const provider = new GoogleAuthProvider()
                      await signInWithPopup(auth, provider)
                      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Signed in', message: 'Welcome back to E-Book Nook.' } }))
                      onClose?.()
                    } catch (err: any) {
                      let msg = 'Google sign-in failed. Please try again.'
                      switch (err?.code) {
                        case 'auth/popup-closed-by-user':
                        case 'auth/cancelled-popup-request':
                          msg = 'Sign-in was cancelled.'
                          break
                        case 'auth/popup-blocked':
                          msg = 'Popup was blocked by the browser.'
                          break
                        case 'auth/operation-not-allowed':
                          msg = 'Google sign-in is disabled. Enable it in Firebase Authentication.'
                          break
                        default:
                          break
                      }
                      console.error('[GoogleSignIn] Error:', err?.code || err)
                      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Sign in error', message: msg } }))
                    }
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-xl shadow-lg bg-white px-3 py-2 text-sm font-semibold text-cyan-700/80 shadow-xs inset-ring inset-slate-300 hover:bg-slate-50 focus-visible:inset-ring-transparent"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                    <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                    <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                    <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                    <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                  </svg>
                  <span className="text-sm/6 font-semibold">Google</span>
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <button 
              type="button"
              onClick={() => setShowSignUp(true)}
              className="font-semibold text-cyan-700 hover:text-cyan-600 underline bg-transparent border-none cursor-pointer"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </>
  )
}
