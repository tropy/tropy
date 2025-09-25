import { join } from 'node:path'
import { existsSync as exists } from 'node:fs'
import { useEffect, useRef, useState } from 'react'
import { useArgs } from '../hooks/use-args.js'
import { useEvent } from '../hooks/use-event.js'
import { useTheme } from '../hooks/use-theme.js'
import { on, off, stylesheet, toggle } from '../dom.js'
import { StyleSheet } from '../res.js'


export function Frame({
  className,
  innerClassName = '',
  onClick,
  onContextMenu,
  onLoad,
  onUnload,
  srcDoc = '<!DOCTYPE html><html><head></head><body></body></html>',
  styleSheet,
  tabIndex
}) {
  let frame = useRef()
  let [doc, setDoc] = useState()
  let { theme, scrollbars } = useTheme()
  let userData = useArgs('data')

  let handleClick = useEvent((event) => {
    onClick?.(event)
  })

  let handleContextMenu = useEvent((event) => {
    onContextMenu?.(event)
  })

  let handleLoad = useEvent(() => {
    let win = frame.current.contentWindow
    setDoc(frame.current.contentDocument)
    on(win, 'unload', () => {
      setDoc(null)
    }, { once: true })
  })

  useEffect(() => {
    let checkModKeys = (event) => {
      toggle(doc.documentElement, 'ctrl-key', event.ctrlKey === true)
      toggle(doc.documentElement, 'meta-key', event.metaKey === true)
    }

    if (doc != null) {
      onLoad?.(doc)
      on(doc, 'contextmenu', handleContextMenu)
      on(doc.body, 'click', handleClick)
      on(document, 'keydown', checkModKeys, { passive: true, capture: true })
      on(document, 'keyup', checkModKeys, { passive: true, capture: true })
      on(doc, 'keydown', checkModKeys, { passive: true, capture: true })
      on(doc, 'keyup', checkModKeys, { passive: true, capture: true })
      on(doc, 'blur', checkModKeys, { passive: true })

      return () => {
        off(doc, 'contextmenu', handleContextMenu)
        off(doc.body, 'click', handleClick)
        off(document, 'keydown', checkModKeys, { passive: true, capture: true })
        off(document, 'keyup', checkModKeys, { passive: true, capture: true })
        off(doc, 'keydown', checkModKeys, { passive: true, capture: true })
        off(doc, 'keyup', checkModKeys, { passive: true, capture: true })
        off(doc, 'blur', checkModKeys, { passive: true })

        onUnload?.()
      }
    }
  }, [doc, handleClick, handleContextMenu, onLoad, onUnload])


  useEffect(() => {
    if (doc != null) {
      let nodes = []

      if (styleSheet) {
        let href = StyleSheet.expand(styleSheet, theme)

        nodes.push(
          stylesheet(href),
          ...([
            join(userData, `${styleSheet}.css`),
            join(userData, `${styleSheet}-${theme}.css`)
          ].filter(exists).map(stylesheet))
        )
      }

      doc.head.replaceChildren(...nodes)
    }
  }, [doc, userData, styleSheet, theme])

  useEffect(() => {
    if (doc != null) {
      toggle(doc.documentElement, 'scrollbar-style-old-school', scrollbars)
    }
  }, [doc, scrollbars])

  useEffect(() => {
    if (doc != null) {
      if (doc.body.className !== innerClassName)
        doc.body.className = innerClassName
    }
  }, [doc, innerClassName])

  return (
    <iframe
      ref={frame}
      className={className}
      onLoad={handleLoad}
      sandbox="allow-same-origin"
      srcDoc={srcDoc}
      tabIndex={tabIndex}/>
  )
}
