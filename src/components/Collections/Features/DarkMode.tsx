import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    let storedTheme: string | null = null
    try { storedTheme = localStorage.getItem('theme') } catch {}
    if (storedTheme === 'dark' || storedTheme === 'light') {
      const dark = storedTheme === 'dark'
      setIsDark(dark)
      if (dark) document.documentElement.setAttribute('data-theme', 'dark')
      else document.documentElement.removeAttribute('data-theme')
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(prefersDark)
      if (prefersDark) document.documentElement.setAttribute('data-theme', 'dark')
      else document.documentElement.removeAttribute('data-theme')
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const dark = e.newValue === 'dark'
        setIsDark(dark)
        if (dark) document.documentElement.setAttribute('data-theme', 'dark')
        else document.documentElement.removeAttribute('data-theme')
      }
    }
    window.addEventListener('storage', onStorage)
    let mql: MediaQueryList | null = null
    try { mql = window.matchMedia('(prefers-color-scheme: dark)') } catch {}
    const onMedia = (e: MediaQueryListEvent) => {
      try {
        const hasStored = localStorage.getItem('theme')
        if (!hasStored) {
          const dark = e.matches
          setIsDark(dark)
          if (dark) document.documentElement.setAttribute('data-theme', 'dark')
          else document.documentElement.removeAttribute('data-theme')
        }
      } catch {}
    }
    mql?.addEventListener('change', onMedia)
    return () => {
      window.removeEventListener('storage', onStorage)
      mql?.removeEventListener('change', onMedia)
    }
  }, [])

  const toggle = () => {
    if (typeof document === 'undefined') return
    setIsDark((prev) => {
      const nextMode = !prev
      if (nextMode) {
        document.documentElement.setAttribute('data-theme', 'dark')
        try { localStorage.setItem('theme', 'dark') } catch {}
      } else {
        document.documentElement.removeAttribute('data-theme')
        try { localStorage.setItem('theme', 'light') } catch {}
      }
      return nextMode
    })
  }

  return { isDark, toggle }
}

// Keep existing utility functions if needed elsewhere, but use hook in components
export function toggleDarkMode() {
   if (document.documentElement.getAttribute('data-theme') === 'dark') {
       document.documentElement.removeAttribute('data-theme')
       localStorage.setItem('theme', 'light')
   } else {
       document.documentElement.setAttribute('data-theme', 'dark')
       localStorage.setItem('theme', 'dark')
   }
 }