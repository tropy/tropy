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

class Button extends PureComponent {
  get classes() {
    return ['btn', 'btn-icon', {
      'active': this.props.isActive,
      'btn-active': this.hasIcon,
      'disabled': this.props.isDisabled
    }]
  }

  get node() {
    return this.props.noFocus ? 'span' : 'button'
  }

  get hasIcon() {
    return this.props.icon != null
  }

  get text() {
    const { intl, text } = this.props

    return text ?
      intl.formatMessage({ id: text }) :
      null
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
    return create(this.node, this.attributes, this.props.icon, this.text)
  }

  static propTypes = {
    icon: element,
    intl: intlShape.isRequired,
    isActive: bool,
    isDisabled: bool,
    noFocus: bool,
    title: string,
    text: string,
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
  Button: injectIntl(Button)
}
