'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, string } = require('prop-types')
const { IconSearch } = require('../icons')
const { BufferedInput } = require('../input')
const { TABS } = require('../../constants')

class SearchField extends PureComponent {

  handleCancel = () => {
  }

  handleChange = (query) => {
    this.props.onSearch(query)
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
          onCommit={this.handleChange}/>
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
