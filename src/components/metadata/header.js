'use strict'

const React = require('react')
const { FormattedMessage } = require('react-intl')
const { ResourceSelect } = require('../resource/')
const { bool, array, func, string } = require('prop-types')
const cx = require('classnames')

class MetadataHeader extends React.PureComponent {

  render() {
    let { ...props } = this.props
    return (
      <h5 className={cx('metadata-heading', {
        separator: props.separator
      })}>
        <FormattedMessage
          id={props.title}
          values={props.count}/>

        <ResourceSelect
          canClearByBackspace={false}
          hideClearButton
          isRequired
          value={props.value}
          onChange={props.onChange}
          options={props.options}/>

      </h5>
    )
  }

  static propTypes = {
    separator: bool,
    title: string.isRequired,
    onChange: func.isRequired,
    value: string,
    options: array
  }

}

module.exports = {
  MetadataHeader
}
