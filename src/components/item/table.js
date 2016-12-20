'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { connect } = require('react-redux')
const { TableRow } = require('./table-row')
const { TableHead } = require('./table-head')
const { getColumns } = require('../../selectors/ui')
const { getCachePrefix } = require('../../selectors/project')
const act = require('../../actions')


class Table extends Component {

  handleSelect = (id, mod) => {
    this.props.onSelect(id, mod)
  }

  handleContextMenu = (item, event) => {
    const { selection, onContextMenu } = this.props

    const context = ['item']
    const target = { id: item.id, tags: item.tags }

    if (selection.length > 1) {
      context.push('bulk')
      target.id = selection
    }

    if (item.deleted) context.push('deleted')

    onContextMenu(event, context.join('-'), target)
  }

  render() {
    const { selection, items, ...props } = this.props

    return (
      <div className="item-table-view">
        <TableHead columns={props.columns}/>

        <div className="table-body">
          <table className="item-table">
            <tbody>
              {items.map(item =>
                <TableRow {...props}
                  key={item.id}
                  item={item}
                  isSelected={selection.includes(item.id)}
                  onSelect={this.handleSelect}
                  onContextMenu={this.handleContextMenu}/>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  static propTypes = {
    selection: PropTypes.arrayOf(PropTypes.number),
    columns: PropTypes.arrayOf(PropTypes.object),
    items: PropTypes.arrayOf(PropTypes.object),
    cache: PropTypes.string,
    onSelect: PropTypes.func,
    onCancel: PropTypes.func,
    onContextMenu: PropTypes.func
  }
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
      }
    })

  )(Table)
}
