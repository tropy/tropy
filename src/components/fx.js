'use strict'

const React = require('react')
const { number } = require('prop-types')
const { on, bounds } = require('../dom')

const {
  CSSTransition,
  Transition,
  TransitionGroup
} = require('react-transition-group')

const onTransitionEnd = (node, done) => {
  on(node, 'transitionend', event => {
    if (event.target === node) done()
  })
}

const Fade = (props) => (
  <CSSTransition
    addEndListener={onTransitionEnd}
    classNames="fade"
    mountOnEnter={false}
    timeout={1000}
    unmountOnExit
    {...props}/>
)

class Collapse extends React.Component {
  willCollapse = (node) => {
    node.style.height = `${
      this.props.height > 0 ?  this.props.height : bounds(node).height
    }px`
  }

  collapse = (node) => {
    node.style.height = '0px'
  }

  didCollapse = (node) => {
    node.style.height = null
  }

  willExpand = (node) => {
    node.style.height = '0px'
  }

  expand = (node) => {
    node.style.height = `${this.props.height}px`
  }

  didExpand = (node) => {
    node.style.height = null
  }

  render() {
    // eslint-disable-next-line no-unused-vars
    let { height, ...props } = this.props

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
        {...props}/>
    )
  }

  static propTypes = {
    height: number
  }
}

module.exports = {
  CSSTransition,
  Transition,
  TransitionGroup,
  onTransitionEnd,
  Collapse,
  Fade
}
