'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { connect } = require('react-redux')
const { ItemTile } = require('./tile')
const { select } = require('../../actions/item')
const { getCachePrefix } = require('../../selectors/project')
const { Shapes } = require('../util')
const { times } = require('../../common/util')


class ItemGrid extends Component {

  get size() {
    return ItemGrid.ZOOM[this.props.zoom]
  }

  get placeholder() {
    return (
      <li className="item-tile" style={{ flexBasis: `${this.size * 1.25}px` }}/>
    )
  }

  render() {
    const { items, ...props } = this.props
    const tile = this.placeholder

    return (
      <div className="item-grid-view">
        <ul className="item-grid">
          {items.map((item) =>
            <ItemTile {...props}
              key={item.id}
              item={item}
              size={this.size}/>
          )}

          {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
          {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
          {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
        </ul>
      </div>
    )
  }

  static ZOOM = [
    24,
    ...times(56, i => i * 4 + 32),
    ...times(32, i => i * 8 + 256),
    512
  ]

  static propTypes = {
    selection: PropTypes.arrayOf(PropTypes.number),
    columns: PropTypes.arrayOf(PropTypes.object),
    items: PropTypes.arrayOf(PropTypes.object),
    cache: PropTypes.string.isRequired,
    zoom: Shapes.number(1, ItemGrid.ZOOM.length - 1),
    onSelect: PropTypes.func,
    onContextMenu: PropTypes.func
  }
}


module.exports = {
  ItemGrid: connect(
    (state) => ({
      selection: state.nav.items,
      cache: getCachePrefix(state)
    }),

    (dispatch) => ({
      onSelect(id, mod) {
        dispatch(select(id, { mod }))
      }
    })

  )(ItemGrid)
}
