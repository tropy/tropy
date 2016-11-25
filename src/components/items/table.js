'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { TableRow } = require('./table-row')
const { TableHead } = require('./table-head')
const { getColumns } = require('../../selectors/ui')
const { getCachePrefix } = require('../../selectors/project')
const { select } = require('../../actions/item')

const Table = ({ items, selection, ...props }) => (
  <div className="item-list-view">
    <TableHead columns={props.columns}/>

    <div className="list-body">
      <table className="item-list">
        <tbody>
          {items.map((item) => (
            <TableRow {...props}
              key={item.id}
              item={item}
              isSelected={selection.includes(item.id)}/>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

Table.propTypes = {
  selection: PropTypes.arrayOf(PropTypes.number),
  handleSelection: PropTypes.func,
  columns: PropTypes.arrayOf(PropTypes.object),
  items: PropTypes.arrayOf(PropTypes.object),
  cache: PropTypes.string
}


module.exports = {
  Table: connect(
    (state) => ({
      selection: state.nav.items,
      columns: getColumns(state),
      cache: getCachePrefix(state)
    }),

    (dispatch) => ({
      handleSelection(id, mod) {
        dispatch(select(id, { mod }))
      }
    })

  )(Table)
}
