'use strict'

const React = require('react')
const { injectIntl, intlShape } = require('react-intl')
const { IconXSmall } = require('../icons')
const { Button } = require('../button')
const { Input } = require('../input')
const debounce = require('lodash.debounce')
const { blank } = require('../../common/util')
const { func, string } = require('prop-types')


class TagFilter extends React.Component {
  get placeholder() {
    return this.props.intl.formatMessage({ id: 'sidebar.tags.filter' })
  }

  handleCancel = () => {
    this.handleChange.cancel()

    if (!blank(this.props.value)) {
      this.props.onChange('')
    }
  }

  handleChange = debounce(filter => {
    this.props.onChange(filter)
  }, 250)

  handleCommit = () => {
    this.handleChange.flush()
  }

  render() {
    return (
      <div className="tag-filter">
        <div className="tag-filter-container">
          <Input
            className="tag-filter-input form-control"
            value={this.props.value}
            placeholder={this.placeholder}
            onCancel={this.handleCancel}
            onChange={this.handleChange}
            onCommit={this.handleCommit}/>
          {!blank(this.props.value) &&
            <Button
              icon={<IconXSmall/>}
              onClick={this.handleCancel}/>}
        </div>
      </div>
    )
  }

  static propTypes = {
    intl: intlShape,
    onChange: func.isRequired,
    value: string.isRequired
  }
}

module.exports.TagFilter = injectIntl(TagFilter)
