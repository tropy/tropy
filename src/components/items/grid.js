'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { select } = require('../../actions/item')

const Grid = ({ items }) => (
  <div className="item-grid-view">
    <div className="grid-body">
      {items.map((item) => (
        <div key={item.id} className="item">{item.id}</div>
      ))}
    </div>
  </div>
)

Grid.propTypes = {
  selection: PropTypes.arrayOf(PropTypes.number),
  onSelect: PropTypes.func,
  columns: PropTypes.arrayOf(PropTypes.object),
  items: PropTypes.arrayOf(PropTypes.object)
}


module.exports = {
  Grid: connect(
    (state) => ({
      selection: state.nav.items
    }),

    (dispatch) => ({
      onSelect(id, mod) {
        dispatch(select(id, { mod }))
      }
    })

  )(Grid)
}
