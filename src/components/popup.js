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
    this.dom = element('div')
    classes(this.dom, 'popup-container')
  }

  componentDidMount() {
    on(document, 'mousedown', this.handleClick, { capture: true })
    on(document, 'mouseup', this.handleClick, { capture: true })
    on(document, 'click', this.handleClick, { capture: true })
    on(document, 'contextmenu', this.handleContextMenu, { capture: true })
    on(window, 'resize', this.handleResize)
    append(this.dom, $('#popup-root'))

    if (this.props.autofocus) {
      let e = $('[tabindex]', this.dom)
      if (e != null) e.focus()
    }
  }

  componentWillUnmount() {
    remove(this.dom)
    off(document, 'mousedown', this.handleClick, { capture: true })
    off(document, 'mouseup', this.handleClick, { capture: true })
    off(document, 'click', this.handleClick, { capture: true })
    off(document, 'contextmenu', this.handleContextMenu, { capture: true })
    off(window, 'resize', this.handleResize)
  }

  handleClick= (event) => {
    if (this.props.onClickOutside != null && !this.isInside(event)) {
      event.stopPropagation()
      event.preventDefault()
      if (event.type === 'click') {
        this.props.onClickOutside(event)
      }
    }
  }

  handleContextMenu = (event) => {
    event.stopPropagation()
    event.preventDefault()
    if (this.props.onClickOutside != null && !this.isInside(event)) {
      this.props.onClickOutside(event)
    }
  }

  isInside({ target, path }) {
    return target === document.activeElement || path.includes(this.dom)
  }

  handleResize = throttle(() => { this.props.onResize() }, 25)

  render() {
    return createPortal((
      <div
        className={cx('popup', this.props.anchor, this.props.className)}
        style={this.props.style}>
        {this.props.children}
      </div>
    ), this.dom)
  }

  static propTypes = {
    anchor: oneOf(['top', 'right', 'bottom', 'left', 'float']),
    autofocus: bool,
    children: node.isRequired,
    className: string,
    onClickOutside: func,
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
    onResize: noop
  }
}

module.exports = {
  Popup
}
