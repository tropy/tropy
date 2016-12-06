'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { TableRow } = require('./table-row')
const { TableHead } = require('./table-head')
const { getColumns } = require('../../selectors/ui')
const { getCachePrefix } = require('../../selectors/project')
const act = require('../../actions')


const Table = ({ items, selection, ...props }) => (
  <div className="item-table-view">
    <TableHead columns={props.columns}/>

    <div className="table-body">
      <table className="item-table">
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
  columns: PropTypes.arrayOf(PropTypes.object),
  items: PropTypes.arrayOf(PropTypes.object),
  cache: PropTypes.string,
  onSelect: PropTypes.func,
  onCancel: PropTypes.func,
  onContextMenu: PropTypes.func
}


module.exports = {
  Table: connect(
    (state) => ({
      selection: state.nav.items,
      columns: getColumns(state),
      cache: getCachePrefix(state)
    }),

    (dispatch) => ({
      onSelect(id, mod) {
        dispatch(act.item.select(id, { mod }))
      },

      onCancel() {
        dispatch(act.ui.edit.cancel())
      },

      onContextMenu(event, item) {
        dispatch(
          act.ui.context.show(
            event, item.deleted ? 'deleted' : 'item', {
              id: item.id,
              tags: item.tags
            }
          )
        )
      }
    })

  )(Table)
}
