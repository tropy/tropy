'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { connect } = require('react-redux')
const { Cell } = require('./cell')
const ui = require('../../actions/ui')
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
      edit, item, columns, onActivate, onCancel, onChange, onContextMenu
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
              value={item[property.name]}
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
    columns: PropTypes.arrayOf(PropTypes.object)
  }
}


module.exports = {
  ListItem: connect(
    (state) => ({
      edit: state.ui.edit.column
    }),

    (dispatch, props) => ({
      onActivate(property) {
        dispatch(ui.edit.start({
          column: {
            item: props.item.id, property
          }
        }))
      },

      onCancel() {
        dispatch(ui.edit.cancel())
      },

      onChange() {
      },

      onContextMenu(event) {
        event.stopPropagation()
        dispatch(ui.context.show(event, 'item', props.item.id))
      }
    })
  )(ListItem)
}
