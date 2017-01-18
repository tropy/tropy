'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { ListNode } = require('./node')
const { connect } = require('react-redux')
const { getChildren } = require('../../selectors/list')
const { create, save } = require('../../actions/list')
const ui = require('../../actions/ui')
const nav = require('../../actions/nav')


class ListTree extends Component {

  renderNewListNode() {
    const { editing, parent, onEditCancel } = this.props

    if (!editing || editing.parent !== parent) return null

    return (
      <ListNode list={editing} isEditing onEditCancel={onEditCancel}/>
    )
  }

  render() {
    const {
      lists, selected, editing, context, ...props
    } = this.props


    return (
      <ol className="lists">
        {
          lists.map(list =>
            <ListNode {...props}
              key={list.id}
              list={list}
              isSelected={selected === list.id}
              isEditing={editing && editing.id === list.id}
              isContext={context === list.id}/>)
        }
        {this.renderNewListNode()}
      </ol>
    )
  }

  static propTypes = {
    parent: PropTypes.number.isRequired,

    lists: PropTypes.array,
    selected: PropTypes.number,
    context: PropTypes.number,
    editing: PropTypes.object,

    onEditCancel: PropTypes.func,

    onUpdate: PropTypes.func,
    onRename: PropTypes.func,
    onSelect: PropTypes.func,

    onContextMenu: PropTypes.func
  }
}

module.exports = {
  ListTree: connect(

    () => {
      const children = getChildren()

      return (state, props) => ({
        selected: state.nav.list,
        context: state.ui.context.list,
        editing: state.ui.edit.list,
        lists: children(state, props)
      })
    },

    (dispatch, props) => ({
      onSelect(list) {
        dispatch(nav.select({ list }))
      },

      onRename(id) {
        dispatch(ui.edit.start({ list: { id } }))
      },

      onUpdate(id, values) {
        dispatch(ui.edit.cancel())
        dispatch(id ?
          save({ id, ...values }) :
          create({ ...values, parent: props.parent }))
      },

      onContextMenu(event, target) {
        event.stopPropagation()
        dispatch(ui.context.show(event, 'list', target))
      }
    })

  )(ListTree)
}
