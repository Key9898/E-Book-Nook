import { useState } from 'react'
import Logo from '../../assets/logo/e-book-nook.svg'
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface SignUpProps {
  onBackToSignIn?: () => void
  onClose?: () => void
  onNavigate?: (page: string) => void
}

export default function SignUp({ onBackToSignIn, onClose, onNavigate }: SignUpProps = {}) {
  const [showPassword, setShowPassword] = useState(false)
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
            Create account
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
              if (!auth || !(auth as any).app) {
                window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Auth not configured', message: 'Please set Firebase env variables.' } }))
                return
              }
              try {
                const cred = await createUserWithEmailAndPassword(auth, email, password)
                window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Account created', message: 'You can now sign in to E-Book Nook.' } }))
                try {
                  if (db && cred.user?.uid) {
                    await addDoc(collection(db, 'notifications'), {
                      type: 'personal',
                      to: cred.user.uid,
                      title: 'Welcome to E-Book Nook',
                      message: 'Thanks for joining! Explore collections and start reading.',
                      read: false,
                      createdAt: serverTimestamp(),
                    })
                  }
                } catch {}
                if (onBackToSignIn) onBackToSignIn()
              } catch (err: any) {
                let msg = 'Sign up failed. Please try again.'
                switch (err?.code) {
                  case 'auth/email-already-in-use':
                    msg = 'This email is already registered.'
                    break
                  case 'auth/operation-not-allowed':
                    msg = 'Email/Password sign-in is disabled. Enable it in Firebase Authentication.'
                    break
                  case 'auth/weak-password':
                    msg = 'Choose a stronger password (min 6 characters).'
                    break
                  case 'auth/invalid-email':
                    msg = 'Enter a valid email address.'
                    break
                  default:
                    break
                }
                console.error('[SignUp] Error:', err?.code || err)
                window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Sign up error', message: msg } }))
              }
            }}>
              <div>
                <label htmlFor="full-name" className="block text-sm/6 font-medium text-slate-900">
                  Full Name
                </label>
                <div className="mt-2">
                  <input
                    id="full-name"
                    name="full-name"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    autoComplete="given-name"
                    className="block w-full rounded-xl shadow-lg bg-white px-3 py-1.5 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-300 placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-700/80 sm:text-sm/6"
                  />
                </div>
              </div>  

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
                    placeholder="Make your strong password"
                    autoComplete="current-password"
                    className="block w-full rounded-xl shadow-lg bg-white pr-10 px-3 py-1.5 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-300 placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-700/80 sm:text-sm/6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-2 flex items-center rounded-xl px-2 text-slate-500 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
                  >
                    {showPassword ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 shrink-0 items-center">
                    <div className="group grid size-4 grid-cols-1">
                      <input
                        id="privacy-policy"
                        name="privacy-policy"
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
                  <label htmlFor="privacy-policy" className="block text-sm/6 text-slate-900">
                    Agree to the{' '}
                    <button
                     type="button"
                     onClick={() => onNavigate?.('privacyPolicy')}
                     className="font-semibold whitespace-nowrap text-cyan-600">
                     Privacy Policy
                    </button>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-6 shrink-0 items-center">
                    <div className="group grid size-4 grid-cols-1">
                      <input
                        id="terms-service"
                        name="terms-service"
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
                  <label htmlFor="terms-service" className="block text-sm/6 text-slate-900">
                    Agree to the{' '}
                    <button
                     type="button"
                     onClick={() => onNavigate?.('termsOfService')}
                     className="font-semibold whitespace-nowrap text-cyan-600">
                     Terms of Service
                    </button>
                  </label>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="rounded-xl shadow-lg bg-cyan-700/80 px-3 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-cyan-600/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 transition-all duration-200 transform hover:scale-105 w-full"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button 
              type="button"
              onClick={onBackToSignIn}
              className="font-semibold text-cyan-700 hover:text-cyan-600 underline bg-transparent border-none cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </>
  )
}
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../../firebaseConfig'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
