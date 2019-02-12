'use strict'

const React = require('react')
const { Select } = require('../select')
const { FormattedMessage } = require('react-intl')
const collate = require('../../collate')
const { bool, array, func, node, number, string } = require('prop-types')
const cx = require('classnames')

class TemplateSelect extends React.PureComponent {
  get placeholder() {
    return this.props.placeholder != null &&
      <FormattedMessage id={this.props.placeholder}/>
  }

  focus = () => {
    if (this.select != null) this.select.focus()
  }

  setSelect = (select) => {
    this.select = select
  }

  toValue = (...args) => (
    <>{this.props.icon}{Select.defaultProps.toText(...args)}</>
  )

  render() {
    let { isMixed, icon, ...props } = this.props

    return (
      <Select {...props}
        className={cx('template-select', { mixed: isMixed, 'has-icon': !!icon })}
        placeholder={this.placeholder}
        toValue={icon ? this.toValue : null}
        ref={this.setContainer}/>
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
    match(tpl, query) {
      return collate.match(tpl.name, query, /\b\w/g)
    },
    tabIndex: -1
  }
}

module.exports = {
  TemplateSelect
}
