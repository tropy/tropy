'use strict'

const React = require('react')
const { IconSearch } = require('../icons')
const { TABINDEX } = require('../../constants')

const SearchField = () => (
  <div className="search">
    <IconSearch/>
    <input
      tabIndex={TABINDEX.SearchField}
      type="text"
      className="search-input form-control"
      placeholder="Search"/>
  </div>
)

module.exports = {
  SearchField
}
