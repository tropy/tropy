'use strict'

const React = require('react')
const { PropTypes } = React
const { ListNode } = require('./node')
const { connect } = require('react-redux')
const { getChildren } = require('../../selectors/list')
const { create, save } = require('../../actions/list')
const ui = require('../../actions/ui')
const nav = require('../../actions/nav')


const ListTree = ({
  lists, selected, editing, context, parent, showListMenu, ...props
}) => {

  if (editing && editing.parent === parent) {
    var newListNode =
      <ListNode {...props} list={editing} isEditing/>
  }

  return (
    <ol className="lists">
      {
        lists.map(list =>
          <ListNode {...props}
            key={list.id}
            list={list}
            isSelected={selected === list.id}
            isEditing={editing && editing.id === list.id}
            context={context === list.id}
            onContextMenu={showListMenu}/>)
      }
      {newListNode}
    </ol>
  )
}

ListTree.propTypes = {
  parent: PropTypes.number.isRequired,

  lists: PropTypes.array,
  selected: PropTypes.number,
  context: PropTypes.number,
  editing: PropTypes.object,

  onCancel: PropTypes.func,

  onUpdate: PropTypes.func,
  onRename: PropTypes.func,
  onSelect: PropTypes.func,

  showListMenu: PropTypes.func
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
      onCancel() {
        dispatch(ui.edit.cancel())
      },

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

      showListMenu(event, target) {
        event.stopPropagation()
        dispatch(ui.context.show(event, 'list', target))
      }
    })

  )(ListTree)
}
