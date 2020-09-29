import React from 'react'
import { FormattedMessage } from 'react-intl'
import { arrayOf, bool, node, func, shape, string } from 'prop-types'
import cx from 'classnames'


export class Tab extends React.PureComponent {
  get classes() {
    return ['tab', {
      active: this.props.isActive,
      disabled: this.props.isDisabled
    }]
  }

  handleClick = () => {
    if (!this.props.isDisabled && !this.props.isActive) {
      this.props.onActivate(this.props.name)
    }
  }

  render() {
    return (
      <li className={cx(this.classes)} onClick={this.handleClick}>
        {this.props.icon}
        <FormattedMessage id={this.props.label}/>
      </li>
    )
  }

  static propTypes = {
    icon: node,
    isActive: bool,
    isDisabled: bool,
    label: string.isRequired,
    name: string.isRequired,
    onActivate: func.isRequired
  }
}


export class TabNav extends React.PureComponent {
  activate = (name) => {
    if (name !== this.props.active) {
      this.props.onChange(name)
    }
  }

  render() {
    return (
      <nav>
        <ul className={cx('nav', 'tabs', {
          justified: this.props.justified
        })}>
          {this.props.tabs.map(tab =>
            <Tab {...tab}
              key={tab.name}
              isActive={this.props.active === tab.name}
              onActivate={this.activate}/>)}
        </ul>
      </nav>
    )
  }

  static propTypes = {
    justified: bool,
    active: string,
    onChange: func.isRequired,
    tabs: arrayOf(shape({
      label: string.isRequired,
      name: string.isRequired
    }))
  }
}

export const TabPane = ({ active, children, className, ...props }) => (
  <div className={cx('tab-pane', active, className)}>
    {children(active, props)}
  </div>
)


TabPane.propTypes = {
  active: string,
  children: func.isRequired,
  className: string
}
