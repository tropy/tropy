import { useContext } from 'react'
import { WindowContext } from '../components/window.js'

export function useWindow() {
  return useContext(WindowContext)
}
