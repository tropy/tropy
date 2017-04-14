'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, string } = require('prop-types')
const { IconSearch } = require('../icons')
const { Editable } = require('../editable')
const { TABS } = require('../../constants')

class SearchField extends PureComponent {

  handleChange = (query) => {
    this.props.onSearch(query)
  }

  render() {
    const { query, isDisabled } = this.props

    return (
      <div className="search">
        <IconSearch/>
        <Editable
          isEditing
          isDisabled={isDisabled}
          tabIndex={TABS.SearchField}
          value={query}
          placeholder="Search"
          onChange={this.handleChange}/>
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
