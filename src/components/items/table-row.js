'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { connect } = require('react-redux')
const { TableCell } = require('./table-cell')
const { get } = require('dot-prop')
const { meta } = require('../../common/os')
const { DC } = require('../../constants/properties')
const act = require('../../actions')
const cn = require('classnames')

class TableRow extends Component {

  get isDisabled() {
    return !!this.props.item.deleted
  }

  get isSelected() {
    return this.props.selection.includes(this.props.item.id)
  }

  handleClick = (event) => {
    return this.props.onSelect(
      this.props.item.id,
      this.isSelected ?
        (meta(event) ? 'remove' : 'clear') :
        (meta(event) ? 'merge' : 'replace')
    )
  }

  handleContextMenu = (event) => {
    event.stopPropagation()

    const { item, selection, onSelect, onContextMenu } = this.props

    const context = ['item']
    const target = { id: item.id, tags: item.tags }

    if (this.isSelected) {
      if (selection.length > 1) {
        context.push('bulk')
        target.id = selection
      }

    } else {
      onSelect(item.id, 'replace')
    }

    if (item.deleted) context.push('deleted')

    onContextMenu(event, context.join('-'), target)
  }

  render() {
    const { editing, columns, ...props } = this.props
    const { isSelected, isDisabled } = this

    delete props.onSelect
    delete props.onContextMenu

    return (
      <tr
        className={cn({ item: true, active: isSelected })}
        onContextMenu={this.handleContextMenu}
        onClick={this.handleClick}>
        {
          columns.map(({ property, width }) => (
            <TableCell {...props}
              key={property.uri}
              isEditing={property.uri === editing}
              isDisabled={isDisabled}
              isSelected={isSelected}
              hasCoverImage={property.uri === DC.TITLE}
              property={property}
              width={width}/>
          ))
        }
      </tr>
    )
  }

  static propTypes = {
    item: PropTypes.shape({
      id: PropTypes.number.isRequired,
      deleted: PropTypes.bool
    }).isRequired,

    data: PropTypes.object,
    editing: PropTypes.string,
    cache: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(PropTypes.object),
    selection: PropTypes.arrayOf(PropTypes.number),

    onSelect: PropTypes.func.isRequired,
    onContextMenu: PropTypes.func,

    onActivate: PropTypes.func,
    onCancel: PropTypes.func,
    onChange: PropTypes.func
  }
}


module.exports = {
  TableRow: connect(
    (state, { item }) => ({
      data: state.metadata[item.id] || {},
      editing: get(state, `ui.edit.column.${item.id}`)
    }),

    (dispatch, { item }) => ({
      onActivate(property) {
        dispatch(act.ui.edit.start({
          column: {
            [item.id]: property
          }
        }))
      },

      onChange(data) {
        dispatch(act.metadata.save({ id: item.id, data }))
        dispatch(act.ui.edit.cancel())
      }
    })
  )(TableRow)
}
