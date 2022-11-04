import { useEffect, useRef, useState } from 'react'
import { func, string } from 'prop-types'
import { useEvent } from '../hooks/use-event.js'
import { useEventHandler } from '../hooks/use-event-handler.js'
import { useTheme } from '../hooks/use-theme.js'
import { on, off, stylesheet } from '../dom.js'
import { StyleSheet } from '../res.js'


export function Frame({
  className,
  innerClassName,
  onContextMenu,
  onLoad,
  onUnload,
  srcDoc,
  styleSheet
}) {
  let frame = useRef()
  let [doc, setDoc] = useState()
  let theme = useTheme()

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
    if (doc != null) {
      onLoad?.(doc)
      on(doc, 'contextmenu', handleContextMenu)

      return () => {
        off(doc, 'contextmenu', handleContextMenu)
        onUnload?.()
      }
    }
  }, [doc, handleContextMenu, onLoad, onUnload])


  useEffect(() => {
    if (doc != null) {
      let nodes = []

      if (styleSheet) {
        let href = StyleSheet.expand(styleSheet, theme)
        nodes.push(stylesheet(href))
      }

      doc.head.replaceChildren(...nodes)
    }
  }, [doc, styleSheet, theme])

  useEffect(() => {
    if (doc != null) {
      if (doc.documentElement.className !== innerClassName)
        doc.documentElement.className = innerClassName
    }
  }, [doc, innerClassName])


  useEventHandler(document, 'dragstart', () => {
    frame.current.inert = true
  })
  useEventHandler(document, 'dragend', () => {
    frame.current.inert = false
  })

  return (
    <iframe
      ref={frame}
      className={className}
      onLoad={handleLoad}
      sandbox="allow-same-origin"
      srcDoc={srcDoc}/>
  )
}

Frame.propTypes = {
  className: string,
  innerClassName: string,
  onContextMenu: func,
  onLoad: func,
  onUnload: func,
  srcDoc: string.isRequired,
  styleSheet: string
}

Frame.defaultProps = {
  innerClassName: '',
  srcDoc: '<!DOCTYPE html><html><head></head><body></body></html>'
}
