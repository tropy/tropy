'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { ListItem } = require('./list-item')
const { ListHead } = require('./list-head')
const { getColumns } = require('../../selectors/ui')
const { select } = require('../../actions/item')

const List = ({ items, columns, selection, onSelect }) => (
  <div className="item-list-view">
    <ListHead columns={columns}/>
    <div className="list-body">
      <table className="item-list">
        <tbody>
          {items.map((item) => (
            <ListItem
              key={item.id}
              selected={selection.includes(item.id)}
              onSelect={onSelect}
              item={item}
              columns={columns}/>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

List.propTypes = {
  selection: PropTypes.arrayOf(PropTypes.number),
  onSelect: PropTypes.func,
  onDeselect: PropTypes.func,
  columns: PropTypes.arrayOf(PropTypes.object),
  items: PropTypes.arrayOf(PropTypes.object)
}


module.exports = {
  List: connect(
    (state) => ({
      selection: state.nav.items,
      columns: getColumns(state)
    }),

    (dispatch) => ({
      onSelect(id, mod) {
        dispatch(select(id, { mod }))
      }
    })

  )(List)
}
