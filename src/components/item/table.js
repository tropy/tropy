'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { ItemTableRow } = require('./table-row')
const { ItemTableHead } = require('./table-head')
const { meta } = require('../../common/os')


class ItemTable extends Component {

  handleSelect = (item, event) => {
    const { selection, onSelect } = this.props
    const isSelected = selection.includes(item.id)

    if (meta(event)) {
      onSelect(item.id, isSelected ? 'remove' : 'merge')

    } else {
      if (!isSelected || selection.length > 1) {
        onSelect(item.id, 'replace')
      }
    }
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
    const { selection, items, onEditCancel, ...props } = this.props

    return (
      <div className="item-table-view">
        <ItemTableHead columns={props.columns}/>

        <div className="table-body">
          <table className="item-table">
            <tbody>
              {items.map(item =>
                <ItemTableRow {...props}
                  key={item.id}
                  item={item}
                  isSelected={selection.includes(item.id)}
                  onSelect={this.handleSelect}
                  onCancel={onEditCancel}
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
    onEditCancel: PropTypes.func,
    onColumnChange: PropTypes.func,
    onColumnEdit: PropTypes.func,
    onContextMenu: PropTypes.func
  }
}


module.exports = {
  ItemTable
}
