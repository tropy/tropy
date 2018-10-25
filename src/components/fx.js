'use strict'

const React = require('react')
const { CSSTransition } = require('react-transition-group')
const { on } = require('../dom')
const { bool, func, node, number, string } = require('prop-types')

const onTransitionEnd = (element, done) => {
  on(element, 'transitionend', event => {
    if (event.target.parentNode === element) done()
  })
}

const Fade = ({ children, persist, ...props }) => (
  <CSSTransition unmountOnExit={!persist} {...props}>
    {children}
  </CSSTransition>
)

Fade.propTypes = {
  addEndListener: func.isRequired,
  children: node.isRequired,
  classNames: string.isRequired,
  persist: bool,
  timeout: number.isRequired
}

Fade.defaultProps = {
  addEndListener: onTransitionEnd,
  classNames: 'fade',
  timeout: 1000
}

module.exports = {
  onTransitionEnd,
  Fade
}
