import { createContext, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useWindow } from '../hooks/use-window.js'

const createDocument = () =>
  document.implementation.createHTMLDocument().body

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

export function QuickLook ({ children }) {
  let win = useWindow()
  let [root] = useState(createDocument)
  let [content, setContent] = useState(null)

  let { title, width, height } = content ?? {}
  let isEmpty = content == null

  useEffect(() => {
    let mo = new MutationObserver(() => {
      win.quicklook.update(root.innerHTML)
    })

    mo.observe(root, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true
    })

    win.quicklook.update(root.innerHTML)

    return () => {
      mo.disconnect()
      win.quicklook.resize(null)
      win.quicklook.update('')
    }
  }, [win, root])

  useEffect(() => {
    win.quicklook.resize(isEmpty ? null : { width, height })
  }, [win, isEmpty, width, height])

  return (
    <QuickLookContext.Provider value={setContent}>
      {createPortal(
        <>
          {title && <h1 className="quicklook-title">{title}</h1>}
          {children}
        </>,
        root)}
    </QuickLookContext.Provider>
  )
}
