'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, string } = require('prop-types')
const { IconSearch, IconXSmall } = require('../icons')
const { IconButton } = require('../button')
const { BufferedInput } = require('../input')
const { TABS } = require('../../constants')
const debounce = require('lodash.debounce')


class SearchField extends PureComponent {

  handleCancel = () => {
    this.handleChange.cancel()

    if (this.props.query !== '') {
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
    const { query, isDisabled } = this.props

    return (
      <div className="search">
        <IconSearch/>
        <BufferedInput
          className="search-input form-control"
          isDisabled={isDisabled}
          tabIndex={TABS.SearchField}
          value={query}
          placeholder="Search"
          onCancel={this.handleCancel}
          onChange={this.handleChange}
          onCommit={this.handleCommit}/>
        <IconButton icon={<IconXSmall/>}/>
      </div>
    )
  }

  static propTypes = {
    isDisabled: bool,
    query: string.isRequired,
    onSearch: func.isRequired
  }
}

module.exports = {
  SearchField
}
