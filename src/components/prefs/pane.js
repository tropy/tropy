import React from 'react'
import { FormattedMessage } from 'react-intl'
import * as icons from '../icons'
import cx from 'classnames'
import { bool, node, func, object, string } from 'prop-types'

export class PrefPaneToggle extends React.PureComponent {
  get classes() {
    return ['pane-toggle', 'btn', this.props.name, {
      active: this.props.isActive
    }]
  }

  get label() {
    return `prefs.${this.props.name}.label`
  }

  handleClick = () => {
    this.props.onClick(this.props.name)
  }

  render() {
    return (
      <button
        className={cx(this.classes)}
        disabled={this.props.isDisabled}
        tabIndex={-1}
        onClick={this.handleClick}>
        {React.createElement(icons[this.props.icon])}
        <FormattedMessage id={this.label}/>
      </button>
    )
  }

  static propTypes = {
    classes: object,
    icon: string.isRequired,
    isActive: bool,
    isDisabled: bool,
    name: string.isRequired,
    onClick: func.isRequired
  }

  static defaultProps = {
    icon: 'IconTemplate'
  }
}

export const PrefPane = (props) => (
  <div className={cx('pane', props.name, { active: props.isActive })}>
    {props.isActive && props.children}
  </div>
)

PrefPane.propTypes = {
  children: node,
  classes: object,
  isActive: bool,
  name: string.isRequired
}
