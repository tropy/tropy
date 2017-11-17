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
    return {
      'btn': true,
      'btn-icon': true,
      'active': this.props.isActive
    }
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
    const {
      noFocus,
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

    if (noFocus) {
      attr.onMouseDown = this.handleMouseDown
    } else {
      attr.tabIndex = tabIndex
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
