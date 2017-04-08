'use strict'

const React = require('react')
const { PropTypes } = require('prop-types')
const { bool } = PropTypes
const { IconSearch } = require('../icons')
const { TABS } = require('../../constants')

const SearchField = ({ isDisabled }) => (
  <div className="search">
    <IconSearch/>
    <input
      type="text"
      className="search-input form-control"
      tabIndex={isDisabled ? null : TABS.SearchField}
      disabled={isDisabled}
      placeholder="Search"/>
  </div>
)

SearchField.propTypes = {
  isDisabled: bool
}

module.exports = {
  SearchField
}
