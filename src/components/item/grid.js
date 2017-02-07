'use strict'

const React = require('react')
const { ItemIterator } = require('./iterator')
const { ItemTile } = require('./tile')
const { Shapes } = require('../util')


class ItemGrid extends ItemIterator {

  get placeholder() {
    return (
      <li
        className="placeholder tile"
        style={{ flexBasis: `${this.size * 1.25}px` }}/>
    )
  }


  render() {
    const tile = this.placeholder

    return (
      <div className="item-grid-view">
        <ul className="item-grid">
          {this.map(({ item, ...props }) =>
            <ItemTile {...props}
              key={item.id}
              item={item}/>
          )}

          {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
          {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
          {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
        </ul>
      </div>
    )
  }


  static propTypes = {
    ...ItemIterator.propTypes,
    zoom: Shapes.number(1, ItemIterator.ZOOM.length - 1)
  }
}


module.exports = {
  ItemGrid
}
