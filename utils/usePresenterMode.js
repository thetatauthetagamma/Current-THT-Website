import { useState, useEffect } from 'react'

const PRESENTER_MODE_KEY = 'tht_presenter_mode'

export function usePresenterMode() {
  const [isPresenterMode, setIsPresenterMode] = useState(false)

  // Load from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(PRESENTER_MODE_KEY)
      if (saved !== null) {
        setIsPresenterMode(saved === 'true')
      }
    }
  }, [])

  // Save to sessionStorage whenever it changes
  const togglePresenterMode = () => {
    const newValue = !isPresenterMode
    setIsPresenterMode(newValue)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(PRESENTER_MODE_KEY, String(newValue))
    }
  }

  return [isPresenterMode, togglePresenterMode]
}
