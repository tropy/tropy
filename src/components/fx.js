import { createElement, useCallback, useRef } from 'react'
import cx from 'classnames'
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
  // TODO not clear if we should add a timeout fallback
  // to remove the listener in case the event does not fire.
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
  className,
  dimension = 'height',
  onChange,
  onCollapse,
  onExpand,
  tagName = 'div',
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
    onCollapse?.()
    onChange?.()
  }, [dimension, onChange, onCollapse])

  let willExpand = useCallback(() => {
    nodeRef.current.style[dimension] = '0px'
  }, [dimension])

  let expand = useCallback(() => {
    nodeRef.current.style[dimension] = `${getValue()}px`
  }, [dimension, getValue])

  let didExpand = useCallback(() => {
    nodeRef.current.style[dimension] = null
    onExpand?.()
    onChange?.()
  }, [dimension, onChange, onExpand])

  return (
    <CSSTransition
      timeout={1000}
      {...props}
      addEndListener={addEndListener}
      classNames="collapse"
      mountOnEnter={false}
      nodeRef={nodeRef}
      onEnter={willExpand}
      onEntered={didExpand}
      onEntering={expand}
      onExit={willCollapse}
      onExited={didCollapse}
      onExiting={collapse}
      unmountOnExit>
      {createElement(tagName, {
        ref: nodeRef,
        className: cx(`collapse-${dimension}`, className),
      }, children)}
    </CSSTransition>
  )
}
