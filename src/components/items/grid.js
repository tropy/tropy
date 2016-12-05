'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { connect } = require('react-redux')
const { ItemTile } = require('./tile')
const { select } = require('../../actions/item')
const { getCachePrefix } = require('../../selectors/project')

const Z = [24, 32, 48, 64, 96, 128, 144, 256, 304, 512]

class ItemGrid extends Component {

  get size() {
    return Z[this.props.zoom]
  }

  get placeholder() {
    return (
      <li className="item-tile" style={{ flexBasis: `${this.size * 1.25}px` }}/>
    )
  }

  render() {
    const { items, selection, ...props } = this.props
    const tile = this.placeholder

    return (
      <div className="item-grid-view">
        <ul className="item-grid">
          {items.map((item) =>
            <ItemTile {...props}
              key={item.id}
              item={item}
              size={this.size}
              isSelected={selection.includes(item.id)}/>
          )}

          {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
        </ul>
      </div>
    )
  }


  static propTypes = {
    selection: PropTypes.arrayOf(PropTypes.number),
    onSelect: PropTypes.func,
    columns: PropTypes.arrayOf(PropTypes.object),
    items: PropTypes.arrayOf(PropTypes.object),
    cache: PropTypes.string.isRequired,
    zoom: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9]).isRequired
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
