'use strict'

const React = require('react')
const { ItemIterator } = require('./iterator')
const { ItemTableRow } = require('./table-row')
const { ItemTableHead } = require('./table-head')
const { arrayOf, oneOf, func, object } = React.PropTypes
const cn = require('classnames')


class ItemTable extends ItemIterator {

  get classes() {
    return {
      'table-body': true,
      'drop-target': !this.props.isDisabled,
      'over': this.props.isOver
    }
  }

  handleColumnEdit = ({ id, property }) => {
    this.props.onEdit({
      column: { [id]: property }
    })
  }

  render() {
    const {
      columns,
      editing,
      onEditCancel,
      onMetadataSave
    } = this.props

    return (
      <div className="item-table">
        <ItemTableHead columns={columns}/>

        {this.connect(
          <div className={cn(this.classes)}>
            {this.renderClickCatcher({ node: 'div' })}
            <table>
              <tbody>
                {this.map(({ item, ...props }) =>
                  <ItemTableRow {...props}
                    key={item.id}
                    item={item}
                    columns={columns}
                    editing={editing}
                    onCancel={onEditCancel}
                    onColumnEdit={this.handleColumnEdit}
                    onMetadataSave={onMetadataSave}/>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  static propTypes = {
    ...ItemIterator.propTypes,
    columns: arrayOf(object).isRequired,
    editing: object.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onMetadataSave: func.isRequired,
    zoom: oneOf([0]).isRequired
  }
}


module.exports = {
  ItemTable
}
