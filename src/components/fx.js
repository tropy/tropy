import React from 'react'
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

export const Fade = (props) => {
  let addEndListener = useEvent((node, done) => {
    if (props.nodeRef) {
      done = node
      node = props.nodeRef.current
    }
    if (node) {
      onTransitionEnd(node, done)
    }
  })

  return (
    <CSSTransition
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

export class Collapse extends React.Component {
  getValue(node) {
    return this.props.value ?
      this.props.value :
      bounds(node.firstElementChild || node)[this.props.dimension]
  }

  willCollapse = (node) => {
    node.style[this.props.dimension] = `${this.getValue(node)}px`
  }

  collapse = (node) => {
    node.style[this.props.dimension] = '0px'
  }

  didCollapse = (node) => {
    node.style[this.props.dimension] = null
  }

  willExpand = (node) => {
    node.style[this.props.dimension] = '0px'
  }

  expand = (node) => {
    node.style[this.props.dimension] = `${this.getValue(node)}px`
  }

  didExpand = (node) => {
    node.style[this.props.dimension] = null
  }

  render() {
    // eslint-disable-next-line no-unused-vars
    let { children, dimension, value, ...props } = this.props

    return (
      <CSSTransition
        addEndListener={onTransitionEnd}
        classNames="collapse"
        mountOnEnter={false}
        timeout={1000}
        unmountOnExit
        onEnter={this.willExpand}
        onEntering={this.expand}
        onEntered={this.didExpand}
        onExit={this.willCollapse}
        onExiting={this.collapse}
        onExited={this.didCollapse}
        {...props}>
        <div className={`collapse-${dimension}`}>
          {children}
        </div>
      </CSSTransition>
    )
  }

  static defaultProps = {
    dimension: 'height'
  }
}
