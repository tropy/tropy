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

  constructor(props) {
    super(props)
  }

  select = (event) => {
    return this.props.handleSelection(
      this.props.item.id,
      this.props.isSelected ?
        (meta(event) ? 'remove' : 'clear') :
        (meta(event) ? 'merge' : 'replace')
    )
  }


  render() {
    const {
      active, item, columns, isSelected, onContextMenu
    } = this.props

    return (
      <tr
        className={cn({ item: true, active: isSelected })}
        onContextMenu={onContextMenu}
        onClick={this.select}>
        {
          columns.map(({ property, width }) => (
            <TableCell {...this.props}
              key={property.uri}
              isActive={property.uri === active}
              isDisabled={!!item.deleted}
              hasIcon={property.uri === DC.TITLE}
              property={property}
              width={width}/>
          ))
        }
      </tr>
    )
  }

  static propTypes = {
    item: PropTypes.shape({
      id: PropTypes.number.isRequired
    }).isRequired,

    data: PropTypes.object,
    active: PropTypes.string,
    cache: PropTypes.string.isRequired,

    isSelected: PropTypes.bool,


    handleSelection: PropTypes.func.isRequired,

    onActivate: PropTypes.func,
    onCancel: PropTypes.func,
    onChange: PropTypes.func,
    onContextMenu: PropTypes.func,
    columns: PropTypes.arrayOf(PropTypes.object)
  }
}


module.exports = {
  TableRow: connect(
    (state, { item }) => ({
      data: state.metadata[item.id] || {},
      active: get(state, `ui.edit.column.${item.id}`)
    }),

    (dispatch, { item }) => ({
      onActivate(property) {
        dispatch(act.ui.edit.start({
          column: {
            [item.id]: property
          }
        }))
      },

      onCancel() {
        dispatch(act.ui.edit.cancel())
      },

      onChange(data) {
        dispatch(act.metadata.save({ id: item.id, data }))
        dispatch(act.ui.edit.cancel())
      },

      onContextMenu(event) {
        event.stopPropagation()

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
  )(TableRow)
}
