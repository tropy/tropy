'use strict'

const React = require('react')
const { PureComponent } = React
const { injectIntl, intlShape } = require('react-intl')
const { bool, func, string } = require('prop-types')
const { IconSearch, IconXSmall } = require('../icons')
const { IconButton } = require('../button')
const { Input } = require('../input')
const { TABS } = require('../../constants')
const { blank } = require('../../common/util')
const debounce = require('lodash.debounce')


class SearchField extends PureComponent {
  get placeholder() {
    return this.props.intl.formatMessage({ id: 'toolbar.search.placeholder' })
  }

  handleCancel = () => {
    this.handleChange.cancel()

    if (!blank(this.props.query)) {
      this.props.onSearch('')
    }
  }

  handleChange = debounce(query => {
    this.props.onSearch(query)
  }, 250)

  handleCommit = () => {
    this.handleChange.flush()
  }

  render() {
    return (
      <div className="search">
        <IconSearch/>
        <Input
          className="search-input form-control"
          isDisabled={this.props.isDisabled}
          tabIndex={TABS.SearchField}
          value={this.props.query}
          placeholder={this.placeholder}
          onCancel={this.handleCancel}
          onChange={this.handleChange}
          onCommit={this.handleCommit}/>
        {!blank(this.props.query) &&
          <IconButton
            icon={<IconXSmall/>}
            onClick={this.handleCancel}/>}
      </div>
    )
  }

  static propTypes = {
    intl: intlShape,
    isDisabled: bool,
    query: string.isRequired,
    onSearch: func.isRequired
  }
}

module.exports = {
  SearchField: injectIntl(SearchField)
}
