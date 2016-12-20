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

  handleClick = (event) => {
    const { item, isSelected, onSelect } = this.props
    const mod = meta(event)

    if (mod) {
      onSelect(item.id, isSelected ? 'remove' : 'merge')

    } else {
      if (!isSelected) {
        onSelect(item.id, 'replace')
      }
    }
  }

  handleContextMenu = (event) => {
    this.props.onContextMenu(event, this.props.item)
  }

  render() {
    const { editing, columns, isSelected, ...props } = this.props
    const { isDisabled } = this

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

    isSelected: PropTypes.bool,

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
