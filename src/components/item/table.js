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
      'click-catcher': true,
      'drop-target': !this.props.isDisabled,
      'over': this.props.isOver
    }
  }

  render() {
    const {
      columns,
      data,
      edit,
      sort,
      onEdit,
      onEditCancel,
      onMetadataSave
    } = this.props

    return (
      <div className="item-table">
        <ItemTableHead columns={columns} sort={sort}/>

        {this.connect(
          <div
            className={cn(this.classes)}
            onClick={this.handleClickOutside}>
            <table>
              <tbody>
                {this.map(({ item, ...props }) =>
                  <ItemTableRow {...props}
                    key={item.id}
                    item={item}
                    data={data[item.id]}
                    columns={columns}
                    edit={edit}
                    onCancel={onEditCancel}
                    onChange={onMetadataSave}
                    onEdit={onEdit}/>
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
    edit: object,
    data: object.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onMetadataSave: func.isRequired,
    zoom: oneOf([0]).isRequired
  }
}


module.exports = {
  ItemTable
}
