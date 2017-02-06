'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { ItemGrid, ItemTable } = require('../item')
const { object, number, func } = PropTypes

class SearchResults extends PureComponent {

  get selection() {
    return this.props.nav.items
  }

  get editing() {
    return this.props.ui.edit
  }

  render() {
    const { zoom, onItemCreate, onItemSelect, ...props } = this.props
    const { editing, selection } = this

    const ItemIterator = zoom ? ItemGrid : ItemTable

    return (
      <div className="search-results">
        <ItemIterator {...props}
          editing={editing}
          selection={selection}
          zoom={zoom}
          onCreate={onItemCreate}
          onSelect={onItemSelect}/>
      </div>
    )
  }

  static propTypes = {
    nav: object.isRequired,
    ui: object.isRequired,
    zoom: number.isRequired,
    onItemCreate: func.isRequired,
    onItemSelect: func.isRequired
  }
}


module.exports = {
  SearchResults
}
