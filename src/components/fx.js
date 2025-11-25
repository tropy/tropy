import { useCallback, useRef } from 'react'
import { useEvent } from '../hooks/use-event.js'
import { CSSTransition, SwitchTransition } from 'react-transition-group'
import { on, off, bounds } from '../dom.js'

export const onTransitionEnd = (node, done) => {
  let handleTransitionEnd = (event) => {
    if (event.target === node) {
      done()
      off(node, 'transitionend', handleTransitionEnd, false)
    }
  }
  on(node, 'transitionend', handleTransitionEnd, false)
}

export function useEndListener(nodeRef) {
  return useEvent((done) => {
    if (nodeRef.current)
      onTransitionEnd(nodeRef.current, done)
  })
}

export const Fade = ({
  nodeRef,
  ...props
}) => {
  let addEndListener = useEndListener(nodeRef)

  return (
    <CSSTransition
      nodeRef={nodeRef}
      addEndListener={addEndListener}
      classNames="fade"
      mountOnEnter={false}
      timeout={1000}
      unmountOnExit
      {...props}/>
  )
}

export {
  SwitchTransition
}

export const Collapse = ({
  children,
  dimension = 'height',
  value,
  ...props
}) => {
  let nodeRef = useRef(null)

  let addEndListener = useEndListener(nodeRef)

  let getValue = useCallback(() => (value ??
    bounds(nodeRef.current.firstElementChild || nodeRef.current)[dimension]
  ), [value, dimension])

  let willCollapse = useCallback(() => {
    nodeRef.current.style[dimension] = `${getValue()}px`
  }, [dimension, getValue])

  let collapse = useCallback(() => {
    nodeRef.current.style[dimension] = '0px'
  }, [dimension])

  let didCollapse = useCallback(() => {
    nodeRef.current.style[dimension] = null
  }, [dimension])

  let willExpand = useCallback(() => {
    nodeRef.current.style[dimension] = '0px'
  }, [dimension])

  let expand = useCallback(() => {
    nodeRef.current.style[dimension] = `${getValue()}px`
  }, [dimension, getValue])

  let didExpand = useCallback(() => {
    nodeRef.current.style[dimension] = null
  }, [dimension])

  return (
    <CSSTransition
      nodeRef={nodeRef}
      addEndListener={addEndListener}
      classNames="collapse"
      mountOnEnter={false}
      timeout={1000}
      unmountOnExit
      onEnter={willExpand}
      onEntering={expand}
      onEntered={didExpand}
      onExit={willCollapse}
      onExiting={collapse}
      onExited={didCollapse}
      {...props}>
      <div ref={nodeRef} className={`collapse-${dimension}`}>
        {children}
      </div>
    </CSSTransition>
  )
}
