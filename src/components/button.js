'use strict'

const React = require('react')
const { PureComponent, createElement: create } = React
const PropTypes = require('prop-types')
const { bool, element, func, number, string } = PropTypes
const { injectIntl, intlShape } = require('react-intl')
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

  get title() {
    const { intl, title } = this.props

    return title ?
      intl.formatMessage({ id: title }) :
      null
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
      disabled: isDisabled,
      title: this.title
    }

    if (!isDisabled) {
      attr.onClick = onClick
      attr.onMouseDown = onMouseDown
    }

    if (canHaveFocus) {
      attr.tabIndex = tabIndex
    } else {
      attr.onMouseDown = this.handleMouseDown
    }

    return attr
  }

  handleMouseDown = (event) => {
    event.preventDefault()
    if (this.props.onMouseDown) this.props.onMouseDown(event)
  }

  render() {
    return create(this.node, this.attributes, this.props.icon)
  }

  static propTypes = {
    canHaveFocus: bool,
    icon: element.isRequired,
    intl: intlShape.isRequired,
    title: string,
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
  IconButton: injectIntl(IconButton)
}
