'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { ItemTile } = require('./tile')
const { select } = require('../../actions/item')
const { getCachePrefix } = require('../../selectors/project')

const ItemGrid = ({ items, selection, ...props }) => (
  <div className="item-grid-view">
    <div className="grid-body">
      {items.map((item) =>
        <ItemTile {...props}
          key={item.id}
          item={item}
          isSelected={selection.includes(item.id)}/>
      )}
    </div>
  </div>
)

ItemGrid.propTypes = {
  selection: PropTypes.arrayOf(PropTypes.number),
  onSelect: PropTypes.func,
  columns: PropTypes.arrayOf(PropTypes.object),
  items: PropTypes.arrayOf(PropTypes.object),
  cache: PropTypes.string.isRequired
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
