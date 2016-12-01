'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { ItemTile } = require('./tile')
const { select } = require('../../actions/item')
const { getCachePrefix } = require('../../selectors/project')

const Z = [32, 48, 64, 96, 128, 144, 256, 304, 512]

const ItemGrid = ({ items, selection, zoom, ...props }) => (
  <div className="item-grid-view">
    <ul className="grid-body">
      {items.map((item) =>
        <ItemTile {...props}
          key={item.id}
          item={item}
          size={Z[zoom]}
          isSelected={selection.includes(item.id)}/>
      )}
    </ul>
  </div>
)

ItemGrid.propTypes = {
  selection: PropTypes.arrayOf(PropTypes.number),
  onSelect: PropTypes.func,
  columns: PropTypes.arrayOf(PropTypes.object),
  items: PropTypes.arrayOf(PropTypes.object),
  cache: PropTypes.string.isRequired,
  zoom: PropTypes.number.isRequired
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
