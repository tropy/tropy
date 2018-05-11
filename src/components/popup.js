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
    on(this.dom, 'mousedown', this.handleClickOutside)
    on(window, 'resize', this.handleResize)
    append(this.dom, $('#popup-root'))

    if (this.props.autofocus) {
      let e = $('[tabindex]', this.dom)
      if (e != null) e.focus()
    }
  }

  componentWillUnmount() {
    remove(this.dom)
    off(this.dom, 'mousedown', this.handleClickOutside)
    off(window, 'resize', this.handleResize)
  }

  handleClickOutside = (event) => {
    if (this.dom === event.target) {
      this.props.onClickOutside(event)
    }
  }

  handleResize = throttle(() => { this.props.onResize() }, 25)

  render() {
    return createPortal((
      <div
        className={cx('popup', this.props.anchor, this.props.className)}
        onContextMenu={swallow}
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

function swallow(event) {
  event.stopPropagation()
}

module.exports = {
  Popup
}
