import { useState, useEffect } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import Header from '../Layouts/Header'
// import Footer from '../Layouts/Footer'
import ScrollToTopButton from '../Layouts/ScrollUpToTopButton'
import AccountSidebar from './AccountSidebar'
import MyReviews from './MyReviews/MyReviews'
import MyComments from './MyComments/MyComments'
import MyActivity from './MyActivity/MyActivity'
import Notifications from './Notifications/Notifications'
import HelpAndInfo from './Help&Info/Help&Info'
import { auth, storage, db } from '../../firebaseConfig'
import { updateProfile, updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider, GoogleAuthProvider, reauthenticateWithPopup, onAuthStateChanged, type UserInfo } from 'firebase/auth'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

interface AccountMainProps {
  onNavigate?: (page: string) => void
}

export default function AccountMain({ onNavigate }: AccountMainProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const user = auth?.currentUser || null
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState<string>(user?.displayName || (user?.email?.split('@')[0] || ''))
  const [email, setEmail] = useState<string>(user?.email || '')
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string>(user?.photoURL || '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [section, setSection] = useState<'profile' | 'myReviews' | 'myComments' | 'myActivity' | 'notifications' | 'helpAndInfo'>('profile')
  const [notifCount, setNotifCount] = useState(0)
  const [sysCount, setSysCount] = useState(0)
  const [perCount, setPerCount] = useState(0)
  
  const avatarLetter = (username || email || 'U').charAt(0).toUpperCase()
  
  // Check if user signed in with Password provider
  const isPasswordUser = !!(user && user.providerData.some((p: UserInfo) => p.providerId === 'password'))
  const isGoogleUser = !!(user && user.providerData.some((p: UserInfo) => p.providerId === 'google.com'))

  const since = user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  useEffect(() => {
    if (!auth) return
    const unsub = onAuthStateChanged(auth, (u) => {
      const providerDisplay = (u?.providerData || []).map((p) => p?.displayName).find(Boolean) || ''
      const providerPhoto = (u?.providerData || []).map((p) => p?.photoURL).find(Boolean) || ''
      setUsername(u?.displayName || providerDisplay || (u?.email?.split('@')[0] || ''))
      setEmail(u?.email || '')
      setPhotoUrl(u?.photoURL || providerPhoto || '')
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!db) return
    const base = collection(db, 'notifications')
    const unsubSystem = onSnapshot(query(base, where('type', '==', 'system')), (snap) => {
      const now = Date.now()
      const maxAgeMs = 7 * 24 * 60 * 60 * 1000
      const uidVal = user?.uid || ''
      let count = 0
      for (const d of snap.docs) {
        const data: any = d.data()
        const readBy = Array.isArray((data as any)?.readBy) ? ((data as any).readBy as string[]) : []
        const perUserUnread = uidVal ? !readBy.includes(uidVal) : true
        const legacyUnread = !data?.read
        const ts = Number((data?.createdAt?.toMillis?.() ?? 0)) || 0
        const fresh = ts > 0 ? (now - ts) <= maxAgeMs : false
        if (perUserUnread && legacyUnread && fresh) count++
      }
      setSysCount(count)
    })
    const unsubPersonal = onSnapshot(query(base, where('type', '==', 'personal'), where('to', '==', user?.uid || ''), where('read', '==', false)), (snap) => {
      setPerCount(snap.docs.length)
    })
    return () => { unsubSystem(); unsubPersonal() }
  }, [user?.uid])

  useEffect(() => { setNotifCount(sysCount + perCount) }, [sysCount, perCount])

  const handleSideNavigate = (page: string) => {
    switch (page) {
      case '#': setSection('profile'); break
      case 'myReviews': setSection('myReviews'); break
      case 'myComments': setSection('myComments'); break
      case 'myActivity': setSection('myActivity'); break
      case 'notification': setSection('notifications'); break
      case 'notifications': setSection('notifications'); break
      case 'helpAndInfo': setSection('helpAndInfo'); break
      default: onNavigate?.(page); break
    }
  }

  return (
    <>
      <Header onNavigate={onNavigate} />
      <div>
        <AccountSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          displayName={username || (email?.split('@')[0] || '')}
          photoUrl={photoUrl}
          onNavigate={handleSideNavigate}
          notifCount={notifCount}
          activeHref={section === 'profile' ? '#' : section}
        />

        <div className="xl:pl-72">
          <main>
            <h1 className="sr-only">Account Settings</h1>
            {section !== 'profile' && (
              <div className="px-4 py-8 sm:px-4 lg:px-10">
                {section === 'myReviews' && <MyReviews />}
                {section === 'myComments' && <MyComments />}
                {section === 'myActivity' && <MyActivity />}
                {section === 'notifications' && <Notifications />}
                {section === 'helpAndInfo' && <HelpAndInfo onNavigate={onNavigate} />}
              </div>
            )}
            {section === 'profile' && (
            <div className="divide-y-[0.5px] divide-gray-200 px-1 sm:px-4 lg:px-8">
              <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-12 sm:px-4 md:grid-cols-3 lg:px-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                  <p className="mt-1 text-base text-gray-500">Manage your account information and settings</p>
                </div>

                <form className="md:col-span-2">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                    <div className="col-span-full flex items-center gap-x-8">
                      {photoUrl ? (
                        <img
                          alt=""
                          src={photoUrl}
                          key={photoUrl}
                          referrerPolicy="no-referrer"
                          className="size-24 flex-none rounded-xl bg-gray-100 object-cover outline -outline-offset-1 outline-black/5"
                        />
                      ) : (
                        <span className="inline-grid place-items-center size-24 rounded-xl bg-cyan-100 text-cyan-700 font-bold text-3xl">
                          {avatarLetter}
                        </span>
                      )}
                      <div>
                        <label htmlFor="avatar-file" className="sr-only">Upload avatar image</label>
                        <input id="avatar-file" type="file" accept="image/png,image/jpeg" aria-label="Upload avatar image" className="sr-only" onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (!user || !storage) {
                            window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Not available', message: 'Auth or storage not configured.' } }))
                            return
                          }
                          if (!/^image\/(png|jpeg)$/i.test(file.type) || file.size > 1024 * 1024) {
                            window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Invalid image', message: 'Use JPG or PNG up to 1MB.' } }))
                            e.currentTarget.value = ''
                            return
                          }
                          try {
                            setAvatarUploading(true)
                            const fileRef = ref(storage, `avatars/${user.uid}/${Date.now()}`)
                            const task = uploadBytesResumable(fileRef, file, { contentType: file.type, cacheControl: 'public,max-age=0' })
                            await new Promise<void>((resolve, reject) => {
                              const timeout = setTimeout(() => {
                                try { task.cancel() } catch {}
                                reject(new Error('timeout'))
                              }, 30000)
                              task.on('state_changed', undefined, (err) => { clearTimeout(timeout); reject(err) }, () => { clearTimeout(timeout); resolve() })
                            })
                            const url = await getDownloadURL(fileRef)
                            const bustUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
                            await updateProfile(user, { photoURL: url })
                            setPhotoUrl(bustUrl)
                            window.dispatchEvent(new CustomEvent('app:user:changed', { detail: { displayName: username, email, photoURL: bustUrl } }))
                            window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Avatar updated', message: 'Your avatar has been changed.' } }))
                          } catch (err: any) {
                            const emsg = (err?.code || err?.message || '').toString().toLowerCase()
                            const isCors = emsg.includes('cors') || emsg.includes('preflight') || emsg.includes('http error')
                            const isAppCheck = emsg.includes('appcheck') || emsg.includes('exchange') || emsg.includes('403')
                            const msg = (isCors || isAppCheck)
                              ? 'Upload blocked (CORS/App Check). Allowlist App Check debug token or adjust rules.'
                              : 'Could not update avatar. Try again.'
                            console.error('[Avatar Upload] Error:', err?.code || err)
                            if (isCors || isAppCheck) {
                              const previewUrl = URL.createObjectURL(file)
                              setPhotoUrl(previewUrl)
                            }
                            window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Upload failed', message: msg } }))
                          } finally {
                            setAvatarUploading(false)
                            e.target.value = ''
                          }
                        }} />
                        <button
                          type="button"
                          onClick={() => document.getElementById('avatar-file')?.click()}
                          disabled={avatarUploading}
                          className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-gray-100 disabled:opacity-50"
                        >
                          {avatarUploading ? 'Uploading...' : 'Change avatar'}
                        </button>
                        <p className="mt-2 text-xs/5 text-gray-500">JPG or PNG. 1MB max.</p>
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label htmlFor="username" className="block text-sm/6 font-medium text-gray-900">Username</label>
                      <div className="mt-2">
                        <input
                          id="username"
                          name="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          disabled={!editing}
                          className="block w-full rounded-xl bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600 sm:text-sm/6 disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">Email</label>
                      <div className="mt-2">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={email}
                          readOnly
                          disabled
                          className="block w-full rounded-xl bg-gray-100 px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label htmlFor="since" className="block text-sm/6 font-medium text-gray-900">Since</label>
                      <div className="mt-2 grid grid-cols-1">
                        <input
                          id="since"
                          name="since"
                          value={since}
                          readOnly
                          disabled
                          className="col-start-1 row-start-1 w-full appearance-none rounded-xl bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 sm:text-sm/6 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    {editing ? (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              if (user) {
                                if (username && username !== (user.displayName || '')) await updateProfile(user, { displayName: username })
                                window.dispatchEvent(new CustomEvent('app:user:changed', { detail: { displayName: username, email: user?.email || email, photoURL: photoUrl } }))
                                window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Saved', message: 'Profile updated.' } }))
                              }
                              setEditing(false)
                            } catch (err) {
                              window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Update failed', message: 'Please re-login to update email or try again.' } }))
                            }
                          }}
                          className="rounded-xl bg-cyan-700 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-cyan-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditing(false); setUsername(user?.displayName || (user?.email?.split('@')[0] || '')); setEmail(user?.email || '') }}
                          className="rounded-xl bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setEditing(true)} className="rounded-xl bg-cyan-700 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-cyan-600">Edit</button>
                    )}
                  </div>

                </form>
              </div>

              {isPasswordUser && (
              <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-12 sm:px-4 md:grid-cols-3 lg:px-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Change password</h2>
                  <p className="mt-1 text-base text-gray-500">Update your password associated with your account.</p>
                </div>

                <form className="md:col-span-2" onSubmit={async (e) => {
                  e.preventDefault()
                  const newPwd = (document.getElementById('new-password') as HTMLInputElement)?.value || ''
                  const confirmPwd = (document.getElementById('confirm-password') as HTMLInputElement)?.value || ''
                  if (newPwd.length < 6 || newPwd !== confirmPwd) {
                    window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Invalid password', message: 'Ensure passwords match and have at least 6 characters.' } }))
                    return
                  }
                  if (!user || !user.email) return
                  try {
                    await updatePassword(user, newPwd)
                    window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Password updated', message: 'Your password has been changed.' } }))
                  } catch {
                    window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Update failed', message: 'Could not update password. Please check your current password.' } }))
                  }
                }}>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">

                    <div className="col-span-full mt-2">
                      <label htmlFor="new-password" className="block text-sm/6 font-medium text-gray-900">
                        New password
                      </label>
                      <div className="mt-2 relative">
                        <input
                          id="new-password"
                          name="new_password"
                          type={showNewPwd ? 'text' : 'password'}
                          autoComplete="new-password"
                          className="block w-full rounded-xl bg-white pr-10 px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600 sm:text-sm/6"
                        />
                        <button type="button" onClick={() => setShowNewPwd((v) => !v)} className="absolute inset-y-0 right-2 flex items-center px-2 text-slate-500 hover:text-slate-700">
                          {showNewPwd ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label htmlFor="confirm-password" className="block text-sm/6 font-medium text-gray-900">
                        Confirm password
                      </label>
                      <div className="mt-2 relative">
                        <input
                          id="confirm-password"
                          name="confirm_password"
                          type={showConfirmPwd ? 'text' : 'password'}
                          autoComplete="new-password"
                          className="block w-full rounded-xl bg-white pr-10 px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600 sm:text-sm/6"
                        />
                        <button type="button" onClick={() => setShowConfirmPwd((v) => !v)} className="absolute inset-y-0 right-2 flex items-center px-2 text-slate-500 hover:text-slate-700">
                          {showConfirmPwd ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex">
                    <button
                      type="submit"
                      className="rounded-xl bg-cyan-700 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-cyan-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
              )}

              <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-12 sm:px-4 md:grid-cols-3 lg:px-8">
                <div>
                  <h2 className="text-base/7 font-semibold text-gray-900">Delete account</h2>
                  <p className="mt-1 text-sm/6 text-gray-500">
                    No longer want to use our service? You can delete your account here. This action is not reversible.
                    All information related to this account will be deleted permanently.
                  </p>
                </div>

                <form className="flex items-start md:col-span-2" onSubmit={async (e) => {
                  e.preventDefault()
                  if (!user) return
                  const confirm = window.confirm('Are you sure you want to delete your account? This cannot be undone.')
                  if (!confirm) return
                  
                  try {
                    if (isPasswordUser && user.email) {
                      // Password User: Ask for password
                      const pwd = window.prompt('Enter your password to confirm account deletion') || ''
                      if (!pwd) return // Cancelled or empty
                      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, pwd))
                    } else if (isGoogleUser) {
                      // Google User: Popup to re-authenticate
                      const provider = new GoogleAuthProvider()
                      await reauthenticateWithPopup(user, provider)
                    }
                    
                    // If re-auth successful, delete user
                    await deleteUser(user)
                    window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Account deleted', message: 'Your account has been deleted.' } }))
                    // Optional: Navigate to home or refresh
                    if (onNavigate) onNavigate('home')
                    else window.location.reload()

                  } catch (err: any) {
                    console.error(err)
                    window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Delete failed', message: err.message || 'Could not delete account. Please re-login and try again.' } }))
                  }
                }}>
                  <button
                    type="submit"
                    className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500"
                  >
                    Yes, delete my account
                  </button>
                </form>
              </div>
            </div>
            )}
          </main>
        </div>
      </div>
      <ScrollToTopButton />
      {/* <Footer onNavigate={onNavigate} /> */}
    </>
  )
}
