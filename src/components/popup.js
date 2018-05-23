'use strict'

const React = require('react')
const { Component } = React
const { createPortal } = require('react-dom')
const { bool, func, node, number, oneOf, shape, string } = require('prop-types')
const { $, append, classes, element, on, off, remove } = require('../dom')
const { noop } = require('../common/util')
const cx = require('classnames')
const throttle = require('lodash.throttle')

class Popup extends Component {
  constructor(props) {
    super(props)
    this.root = $('#popup-root')
    this.dom = element('div')
    classes(this.dom, 'popup-container')
  }

  componentDidMount() {
    on(this.dom, 'mousedown', this.handleClick)
    on(this.dom, 'contextmenu', this.handleContextMenu)
    on(window, 'resize', this.handleResize)
    this.clip()
    append(this.dom, this.root)
    if (this.props.autofocus) this.focus()
    document.body.style.pointerEvents = 'none'
  }

  componentWillUnmount() {
    remove(this.dom)
    off(this.dom, 'mousedown', this.handleClick)
    off(this.dom, 'contextmenu', this.handleContextMenu)
    off(window, 'resize', this.handleResize)
    this.clip(null)
    document.body.style.pointerEvents = null
  }

  get classes() {
    return ['popup', this.props.anchor, this.props.className, {
      'fade-in': this.props.fadeIn
    }]
  }

  clip(path = this.getClipPath()) {
    this.root.style.clipPath = this.dom.style.clipPath = path
  }

  focus() {
    let e = $('[tabindex]', this.dom)
    if (e != null) e.focus()
  }

  getClipPath({ clip } = this.props) {
    return (clip == null) ?
      null :
      `polygon(${[
        '100% 100%, 100% 0px, 0px 0px, 0px 100%, 100% 100%',
        `${clip.right}px ${clip.bottom}px`,
        `${clip.left}px ${clip.bottom}px`,
        `${clip.left}px ${clip.top}px`,
        `${clip.right}px ${clip.top}px`,
        `${clip.right}px ${clip.bottom}px`
      ].join(', ')})`
  }

  handleClick = (event) => {
    if (this.isOutside(event)) {
      event.stopPropagation()
      event.preventDefault()
      if (event.button === 0) {
        this.props.onClickOutside(event)
      }
    }
  }

  handleContextMenu = (event) => {
    event.stopPropagation()
    event.preventDefault()
    if (this.isOutside(event)) {
      this.props.onClickOutside(event)
    }
  }

  isOutside({ target }) {
    return target === this.dom
  }

  handleResize = throttle(() => { this.props.onResize() }, 25)

  render() {
    return createPortal((
      <div className={cx(this.classes)} style={this.props.style}>
        {this.props.children}
      </div>
    ), this.dom)
  }

  static propTypes = {
    anchor: oneOf(['top', 'right', 'bottom', 'left', 'float']),
    clip: shape({
      top: number.isRequired,
      bottom: number.isRequired,
      left: number.isRequired,
      right: number.isRequired
    }),
    autofocus: bool,
    fadeIn: bool,
    children: node.isRequired,
    className: string,
    onClickOutside: func.isRequired,
    onResize: func.isRequired,
    style: shape({
      top: number,
      left: number,
      width: number,
      height: number
    })
  }

  static defaultProps = {
    anchor: 'float',
    onClickOutside: noop,
    onResize: noop
  }
}

module.exports = {
  Popup
}
