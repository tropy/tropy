'use strict'

const React = require('react')
const { PureComponent, createElement: create } = React
const PropTypes = require('prop-types')
const { bool, element, func, node, number, string } = PropTypes
const { injectIntl, intlShape } = require('react-intl')
const cx = require('classnames')


const ButtonGroup = ({ children }) => (
  <div className="btn-group">{children}</div>
)

ButtonGroup.propTypes = {
  children: node
}

class IconButton extends PureComponent {
  get classes() {
    return ['btn', 'btn-icon', {
      active: this.props.isActive,
      disabled: this.props.isDisabled
    }]
  }

  get node() {
    return this.props.noFocus ? 'span' : 'button'
  }

  get title() {
    const { intl, title } = this.props

    return title ?
      intl.formatMessage({ id: title }) :
      null
  }

  get attributes() {
    const attr = {
      className: cx(...this.classes),
      disabled: !this.props.noFocus && this.props.isDisabled,
      title: this.title
    }

    if (this.props.noFocus) {
      attr.onMouseDown = this.handleMouseDown
      attr.onClick = this.handleClick

    } else {
      attr.onClick = this.props.onClick
      attr.onMouseDown = this.props.onMouseDown
      attr.tabIndex = this.props.tabIndex
    }

    return attr
  }

  handleClick = (event) => {
    event.preventDefault()

    if (!this.props.isDisabled && this.props.onClick) {
      this.props.onClick(event)
    }
  }

  handleMouseDown = (event) => {
    event.preventDefault()

    if (!this.props.isDisabled && this.props.onMouseDown) {
      this.props.onMouseDown(event)
    }
  }

  render() {
    return create(this.node, this.attributes, this.props.icon)
  }

  static propTypes = {
    icon: element.isRequired,
    intl: intlShape.isRequired,
    isActive: bool,
    isDisabled: bool,
    noFocus: bool,
    title: string,
    tabIndex: number,
    onClick: func,
    onMouseDown: func
  }

  static defaultProps = {
    noFocus: false,
    tabIndex: -1
  }
}


module.exports = {
  ButtonGroup,
  IconButton: injectIntl(IconButton)
}
