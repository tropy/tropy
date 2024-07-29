import React from 'react'
import { createPortal } from 'react-dom'
import { $, append, element, has, on, off, toggle, remove } from '../dom.js'
import { noop } from '../common/util.js'
import cx from 'classnames'
import throttle from 'lodash.throttle'

export class Popup extends React.Component {
  constructor(props) {
    super(props)
    this.root = $('#popup-root')
    this.dom = element('div')
    toggle(this.dom, 'popup-container', true)
  }

  componentDidMount() {
    on(window, 'resize', this.handleResize)
    this.clip()
    append(this.dom, this.root)
    toggle(document.documentElement, 'popup-open', true)
    if (this.props.autofocus) this.focus()
  }

  componentWillUnmount() {
    remove(this.dom)
    off(window, 'resize', this.handleResize)
    this.clip(null)
    toggle(document.documentElement, 'popup-open', false)
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

    } else if (this.isClickToScroll(event)) {
      event.stopPropagation()
      event.preventDefault()
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

  isClickToScroll({ target }) {
    return has(target, 'scroll-container')
  }

  handleResize = throttle(() => { this.props.onResize() }, 25)

  render() {
    return createPortal((
      <div
        className={cx(this.classes)}
        style={this.props.style}
        onContextMenu={this.handleContextMenu}
        onMouseDown={this.handleClick}>
        {this.props.children}
      </div>
    ), this.dom)
  }

  static defaultProps = {
    anchor: 'float',
    onClickOutside: noop,
    onResize: noop
  }
}
