'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { connect } = require('react-redux')
const { Cell } = require('./cell')
const { get } = require('dot-prop')
const { meta } = require('../../common/os')
const act = require('../../actions')
const cn = require('classnames')

class ListItem extends Component {

  constructor(props) {
    super(props)
  }

  select = (event) => {
    return this.props.onSelect(
      this.props.item.id,
      this.props.selected ?
        (meta(event) ? 'remove' : 'clear') :
        (meta(event) ? 'merge' : 'replace')
    )
  }

  render() {
    const {
      active, item, data, columns, selected,
      onActivate, onCancel, onChange, onContextMenu
    } = this.props

    return (
      <tr
        className={cn({ item: true, active: selected })}
        onContextMenu={onContextMenu}
        onClick={this.select}>
        {
          columns.map(({ property, width }, idx) => (
            <Cell
              key={idx}
              disabled={!!item.deleted}
              property={property}
              value={data[property.name]}
              icon={idx ? null : item.image}
              width={width}
              active={property.name === active}
              onActivate={onActivate}
              onCancel={onCancel}
              onChange={onChange}/>
          ))
        }
      </tr>
    )
  }

  static propTypes = {
    selected: PropTypes.bool,
    active: PropTypes.string,
    onSelect: PropTypes.func,
    onActivate: PropTypes.func,
    onCancel: PropTypes.func,
    onChange: PropTypes.func,
    onContextMenu: PropTypes.func,
    item: PropTypes.object,
    data: PropTypes.object,
    columns: PropTypes.arrayOf(PropTypes.object)
  }
}


module.exports = {
  ListItem: connect(
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
            event, item.deleted ? 'deleted-item' : 'item', item.id
          )
        )
      }
    })
  )(ListItem)
}
