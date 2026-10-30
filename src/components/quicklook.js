import { createContext, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useWindow } from '../hooks/use-window.js'

const QuickLookContext = createContext(() => {})

export const useQuickLookContent = (content) => {
  let setContent = useContext(QuickLookContext)

  let { title, width, height } = content ?? {}
  let isEmpty = content == null

  useEffect(() => {
    setContent(isEmpty ? null : { title, width, height })

    return () => {
      setContent(null)
    }
  }, [setContent, isEmpty, title, width, height])
}

// Renders children into the window's quicklook companion.
export function QuickLook ({ children }) {
  let win = useWindow()
  let [root] = useState(() => win.quicklook.open())
  let [content, setContent] = useState(null)

  let { title, width, height } = content ?? {}
  let isEmpty = content == null

  useEffect(() => {
    win.quicklook.resize(isEmpty ? null : { width, height })
  }, [win, isEmpty, width, height])

  useEffect(() => () => {
    win.quicklook.resize(null)
  }, [win])

  if (root == null)
    return null

  return (
    <QuickLookContext.Provider value={setContent}>
      {createPortal(
        <>
          {title && <h1 className="quicklook-title">{title}</h1>}
          <div className="quicklook-content">{children}</div>
        </>,
        root)}
    </QuickLookContext.Provider>
  )
}
