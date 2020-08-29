import React from 'react'
import { Select } from '../select'
import { FormattedMessage } from 'react-intl'
import { match } from '../../collate'
import { bool, array, func, node, number, string } from 'prop-types'
import cx from 'classnames'


export class TemplateSelect extends React.PureComponent {
  select = React.createRef()

  get placeholder() {
    return this.props.placeholder != null &&
      <FormattedMessage id={this.props.placeholder}/>
  }

  focus = () => {
    this.select.current?.focus()
  }

  render() {
    let { isMixed, ...props } = this.props

    return (
      <Select {...props}
        className={cx('template-select', { mixed: isMixed })}
        placeholder={this.placeholder}
        ref={this.select}/>
    )
  }

  static propTypes = {
    icon: node,
    isMixed: bool,
    match: func.isRequired,
    options: array.isRequired,
    placeholder: string,
    tabIndex: number.isRequired
  }

  static defaultProps = {
    ...Select.defaultProps,
    match: (tpl, query) => (
      match(tpl.name, query, /\b\w/g)
    ),
    tabIndex: -1
  }
}
