import { useEffect, useRef, useState } from 'react'
import { func, string } from 'prop-types'
import throttle from 'lodash.throttle'
import { useEvent } from '../hooks/use-event.js'
import { useTheme } from '../hooks/use-theme.js'
import { on, off, stylesheet, toggle } from '../dom.js'
import { StyleSheet } from '../res.js'


export function Frame({
  className,
  innerClassName,
  onClick,
  onContextMenu,
  onLoad,
  onUnload,
  srcDoc,
  styleSheet
}) {
  let frame = useRef()
  let [doc, setDoc] = useState()
  let theme = useTheme()

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
      toggle(doc.body, 'ctrl-key', event.ctrlKey === true)
      toggle(doc.body, 'meta-key', event.metaKey === true)
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
  onClick: func,
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
