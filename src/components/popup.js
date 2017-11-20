'use strict'

const React = require('react')
const { Component } = React
const { createPortal } = require('react-dom')
const { func, node, number, oneOf, shape, string } = require('prop-types')
const { $, append, classes, element, on, off, remove } = require('../dom')
const cx = require('classnames')
const throttle = require('lodash.throttle')


class Popup extends Component {
  constructor(props) {
    super(props)
    this.dom = element('div')
    classes(this.dom, 'popup-container')
  }

  componentDidMount() {
    append(this.dom, $('#popup-root'))
    on(window, 'resize', this.handleResize)
  }

  componentWillUnmount() {
    remove(this.dom)
    off(window, 'resize', this.handleResize)
  }

  handleResize = throttle(() => {
    if (this.props.onResize) this.props.onResize()
  }, 25)

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
    children: node.isRequired,
    className: string,
    onResize: func,
    style: shape({
      top: number,
      left: number,
      width: number,
      height: number
    })
  }

  static defaultProps = {
    anchor: 'float'
  }
}

module.exports = {
  Popup
}
