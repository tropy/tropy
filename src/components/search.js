'use strict'

const React = require('react')
const { IconSearch } = require('./icons')

const Search = () => (
  <div className="search">
    <IconSearch/>
    <input type="text" className="search-input form-control"
      placeholder="Search"/>
  </div>
)

module.exports = { Search }
