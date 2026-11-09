import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import cx from 'classnames'
import { useEvent } from '../hooks/use-event.js'
import { useIpcEventHandler } from '../hooks/use-ipc.js'
import { useWindow } from '../hooks/use-window.js'

const QuickLookContext = createContext({
  isVisible: false,
  setTitle () {}
})

export const useQuickLookVisible = () =>
  useContext(QuickLookContext).isVisible

export const useQuickLookTitle = (title) => {
  let { setTitle } = useContext(QuickLookContext)

  useEffect(() => {
    setTitle(title)

    return () => {
      setTitle(null)
    }
  }, [setTitle, title])
}

export function QuickLook ({ children }) {
  let win = useWindow()
  let [root] = useState(() => win.quicklook.open())
  let [title, setTitle] = useState(null)
  let [isVisible, setVisible] = useState(false)

  let [isTitleVisible, setTitleVisible] = useState(false)
  let timer = useRef()

  useEffect(() => () => {
    clearTimeout(timer.current)
    win.quicklook.fit(null)
  }, [win])

  // Shows the titlebar for a while when the window is
  // shown and when the content changes.
  let showTitle = useEvent(() => {
    setTitleVisible(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setTitleVisible(false), 2000)
  })

  useEffect(() => {
    if (title) showTitle()
  }, [title, showTitle])

  useIpcEventHandler('quicklook', (_, state) => {
    setVisible(state.isVisible)
    if (state.isVisible) showTitle()
  })

  if (root == null)
    return null

  return (
    <QuickLookContext.Provider value={{ isVisible, setTitle }}>
      {createPortal(
        <>
          <header
            className={cx('quicklook-titlebar', { visible: isTitleVisible })}>
            <h1 className="quicklook-title">{title}</h1>
          </header>
          <div className="quicklook-content">{children}</div>
        </>,
        root)}
    </QuickLookContext.Provider>
  )
}
