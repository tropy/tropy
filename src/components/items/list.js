'use strict'

const React = require('react')

const { PropTypes } = React
const { connect } = require('react-redux')
const { update } = require('../../actions/nav')
const { ListItem } = require('./list-item')
const { ListHead } = require('./list-head')
const { getColumns } = require('../../selectors/ui')
const { getItems } = require('../../selectors/items')

const List = ({ items, columns, current, onSelect }) => (
  <div className="item-list-view">
    <ListHead columns={columns}/>
    <div className="list-body">
      <table className="item-list">
        <tbody>
          {items.map((item) => (
            <ListItem
              key={item.id}
              current={current}
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
  current: PropTypes.number,
  onSelect: PropTypes.func,
  columns: PropTypes.arrayOf(PropTypes.object),
  items: PropTypes.arrayOf(PropTypes.object)
}


module.exports = {
  List: connect(
    state => ({
      current: state.nav.item,
      columns: getColumns(state),
      items: getItems(state)
    }),

    dispatch => ({
      onSelect: (item) => dispatch(update({ item }))
    })

  )(List)
}
