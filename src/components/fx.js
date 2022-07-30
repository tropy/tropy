import React from 'react'
import { CSSTransition } from 'react-transition-group'
import { element, number, oneOf } from 'prop-types'
import { on, bounds } from '../dom.js'


export const onTransitionEnd = (node, done) => {
  on(node, 'transitionend', event => {
    if (event.target === node) done()
  })
}

export const Fade = (props) => (
  <CSSTransition
    addEndListener={onTransitionEnd}
    classNames="fade"
    mountOnEnter={false}
    timeout={1000}
    unmountOnExit
    {...props}/>
)

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

  static propTypes = {
    children: element.isRequired,
    dimension: oneOf(['height', 'width']),
    value: number
  }

  static defaultProps = {
    dimension: 'height'
  }
}
