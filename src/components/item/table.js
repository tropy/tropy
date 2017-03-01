'use strict'

const React = require('react')
const { ItemIterator } = require('./iterator')
const { ItemTableRow } = require('./table-row')
const { ItemTableHead } = require('./table-head')
const { arrayOf, func, object } = React.PropTypes
const { on, off } = require('../../dom')
const cx = require('classnames')


class ItemTable extends ItemIterator {

  componentDidMount() {
    on(this.container, 'tab:focus', this.handleFocus)
  }

  componentWillUnmount() {
    off(this.container, 'tab:focus', this.handleFocus)
  }

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
      onMetadataSave,
      onSort
    } = this.props

    return (
      <div
        className="item table"
        ref={this.setContainer}
        tabIndex={this.tabIndex}
        onKeyDown={this.handleKeyDown}>
        <ItemTableHead columns={columns} sort={sort} onSort={onSort}/>

        {this.connect(
          <div
            className={cx(this.classes)}
            onClick={this.handleClickOutside}>
            <div className="scroll-container">
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
    onMetadataSave: func.isRequired
  }
}


module.exports = {
  ItemTable
}
