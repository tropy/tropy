'use strict'

const React = require('react')
const { IconSearch } = require('../icons')
const { STYLE } = require('../../constants')

const SearchField = () => (
  <div className="search">
    <IconSearch/>
    <input
      tabIndex={STYLE.TABS.SearchField}
      type="text"
      className="search-input form-control"
      placeholder="Search"/>
  </div>
)

module.exports = {
  SearchField
}
