'use strict'

const React = require('react')
const { PureComponent, PropTypes, createElement: create } = React
const { bool, element, func, number, string } = PropTypes
const cx = require('classnames')


class IconButton extends PureComponent {
  get classes() {
    return {
      'btn': true,
      'btn-icon': true,
      'active': this.props.isActive
    }
  }

  get node() {
    return this.props.canHaveFocus ? 'button' : 'span'
  }

  get attributes() {
    const {
      canHaveFocus,
      isDisabled,
      tabIndex,
      onClick,
      onMouseDown
    } = this.props


    const attr = {
      className: cx(this.classes),
      disabled: isDisabled
    }

    if (!isDisabled) {
      attr.onClick = onClick
      attr.onMouseDown = onMouseDown
    }

    if (canHaveFocus) {
      attr.tabIndex = tabIndex
    }

    return attr
  }

  render() {
    return create(this.node, this.attributes, this.props.icon)
  }

  static propTypes = {
    canHaveFocus: bool,
    icon: element.isRequired,
    id: string,
    isActive: bool,
    isDisabled: bool,
    tabIndex: number,
    onClick: func,
    onMouseDown: func
  }

  static defaultProps = {
    canHaveFocus: true,
    tabIndex: -1
  }
}


module.exports = {
  IconButton
}
