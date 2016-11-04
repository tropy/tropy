'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { connect } = require('react-redux')
const { Cell } = require('./cell')
const act = require('../../actions')
const cn = require('classnames')

class ListItem extends Component {

  constructor(props) {
    super(props)
  }

  get active() {
    return this.props.item.id === this.props.current
  }

  select = () => {
    if (!this.active) {
      this.props.onSelect(this.props.item.id)
    }
  }

  render() {
    const {
      edit, item, data, columns, onActivate, onCancel, onChange, onContextMenu
    } = this.props

    return (
      <tr
        className={cn({ item: true, active: this.active })}
        onContextMenu={onContextMenu}
        onClick={this.select}>
        {
          columns.map(({ property, width }, idx) => (
            <Cell
              key={idx}
              property={property}
              value={data[property.name]}
              icon={idx ? null : item.image}
              width={width}
              active={
                edit && item.id === edit.item && property.name === edit.property
              }
              onActivate={onActivate}
              onCancel={onCancel}
              onChange={onChange}/>
          ))
        }
      </tr>
    )
  }

  static propTypes = {
    current: PropTypes.number,
    edit: PropTypes.object,
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
    (state, props) => ({
      data: state.metadata[props.item.id] || {},
      edit: state.ui.edit.column
    }),

    (dispatch, props) => ({
      onActivate(property) {
        dispatch(act.ui.edit.start({
          column: {
            item: props.item.id, property
          }
        }))
      },

      onCancel() {
        dispatch(act.ui.edit.cancel())
      },

      onChange(data) {
        dispatch(act.metadata.save({ id: props.item.id, data }))
        dispatch(act.ui.edit.cancel())
      },

      onContextMenu(event) {
        event.stopPropagation()
        dispatch(act.ui.context.show(event, 'item', props.item.id))
      }
    })
  )(ListItem)
}
