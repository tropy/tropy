'use strict'

const React = require('react')
const { ItemIterator } = require('./iterator')
const { ItemTile } = require('./tile')
const { Shapes } = require('../util')
const cn = require('classnames')


class ItemGrid extends ItemIterator {

  get classes() {
    return {
      'item-grid': true,
      'click-catcher': true,
      'drop-target': !this.props.isDisabled,
      'over': this.props.isOver
    }
  }

  get placeholder() {
    return (
      <li
        className="placeholder tile click-catcher"
        style={{ flexBasis: `${this.size * 1.25}px` }}/>
    )
  }


  render() {
    const tile = this.placeholder

    return this.connect(
      <ul
        className={cn(this.classes)}
        onClick={this.handleClickOutside}>
        {this.map(({ item, ...props }) =>
          <ItemTile {...props}
            key={item.id}
            item={item}
            onClickOutside={this.handleClickOutside}/>
        )}

        {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
        {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
        {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
      </ul>
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
