import React from 'react'
import { injectIntl } from 'react-intl'
import cx from 'classnames'
import { on, off } from '../dom'
import { noop } from '../common/util'
import {
  bool, element, func, node, number, object, oneOf, string
} from 'prop-types'


export const ButtonGroup = ({ children }) => (
  <div className="btn-group">{children}</div>
)

ButtonGroup.propTypes = {
  children: node
}

class Button extends React.PureComponent {
  state = {
    hasTabFocus: false
  }

  componentDidMount() {
    on(this.container, 'tab:focus', this.handleTabFocus)
  }

  componentWillUnmount() {
    off(this.container, 'tab:focus', this.handleTabFocus)
  }

  get classes() {
    return ['btn', this.props.className, `btn-${this.props.size}`, {
      'active': this.props.isActive,
      'btn-block': this.props.isBlock,
      'btn-default': this.props.isDefault,
      'btn-icon': this.props.icon != null,
      'btn-primary': this.props.isPrimary,
      'disabled': this.props.isDisabled,
      'tab-focus': this.state.hasTabFocus
    }]
  }

  get node() {
    return this.props.noFocus ? 'span' : 'button'
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
      onBlur: this.handleBlur,
      onFocus: this.props.onFocus,
      ref: this.setContainer,
      title: this.title
    }

    if (!this.props.isDisabled) {
      if (this.props.noFocus) {
        attr.onMouseDown = this.handleMouseDown
        attr.onClick = this.handleClick

      } else {
        attr.onClick = this.props.onClick
        attr.onMouseDown = this.props.onMouseDown
        attr.tabIndex = this.props.tabIndex
      }
    }

    return attr
  }

  setContainer = (container) => {
    this.container = container
  }

  handleTabFocus = () => {
    this.setState({ hasTabFocus: true })
  }

  handleBlur = (event) => {
    this.setState({ hasTabFocus: false })
    this.props.onBlur(event)
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
    return React.createElement(
      this.node,
      this.attributes,
      this.props.icon,
      this.text)
  }

  static propTypes = {
    className: string,
    icon: element,
    intl: object.isRequired,
    isActive: bool,
    isBlock: bool,
    isDefault: bool,
    isDisabled: bool,
    isPrimary: bool,
    noFocus: bool,
    size: oneOf(['sm', 'md', 'lg']),
    title: string,
    text: string,
    tabIndex: number,
    onBlur: func.isRequired,
    onFocus: func.isRequired,
    onClick: func,
    onMouseDown: func
  }

  static defaultProps = {
    onBlur: noop,
    onFocus: noop,
    noFocus: false,
    size: 'md',
    tabIndex: -1
  }
}

const IntlButton = injectIntl(Button)
export { IntlButton as Button }
