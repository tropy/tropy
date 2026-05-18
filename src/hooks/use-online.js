import { useEffect, useState } from 'react'
import { isOnline } from '../dom.js'

export function useOnline () {
  let [online, setOnline] = useState(isOnline)

  useEffect(() => {
    let handleChange = () => {
      setOnline(isOnline())
    }

    window.addEventListener('online', handleChange)
    window.addEventListener('offline', handleChange)

    return () => {
      window.removeEventListener('online', handleChange)
      window.removeEventListener('offline', handleChange)
    }
  }, [])

  return online
}
