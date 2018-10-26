'use strict'

const React = require('react')
const { on } = require('../dom')

const {
  CSSTransition,
  Transition,
  TransitionGroup
} = require('react-transition-group')

const onTransitionEnd = (element, done) => {
  on(element, 'transitionend', event => {
    if (event.target === element) done()
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

module.exports = {
  CSSTransition,
  Transition,
  TransitionGroup,
  onTransitionEnd,
  Fade
}
