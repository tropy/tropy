'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { Editable } = require('./editable')
const { IconFolder } = require('./icons')
const { getChildren } = require('../selectors/list')
const { create, save } = require('../actions/list')
const ui = require('../actions/ui')
const nav = require('../actions/nav')
const cn = require('classnames')


class List extends Component {

  update = (name) => {
    this.props.onUpdate(this.props.list.id, { name })
  }

  click = () => {
    if (this.props.isSelected) {
      this.props.onRename(this.props.list.id)
    } else {
      this.props.onSelect(this.props.list.id)
    }
  }

  popup = (event) => {
    this.props.onContextMenu(event, this.props.list.id)
  }

  render() {
    const {
      list, isSelected, context, isEditing, onCancel
    } = this.props

    return (
      <li
        className={cn({ list: true, active: isSelected, context })}
        onContextMenu={this.popup}
        onClick={this.click}>
        <IconFolder/>
        <div className="title">
          <Editable
            value={list.name}
            isRequired
            isEditing={isEditing}
            onCancel={onCancel}
            onChange={this.update}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    list: PropTypes.object,
    isSelected: PropTypes.bool,
    context: PropTypes.bool,

    isEditing: PropTypes.bool,
    onCancel: PropTypes.func,

    onContextMenu: PropTypes.func,
    onRename: PropTypes.func,
    onSelect: PropTypes.func,
    onUpdate: PropTypes.func
  }

}


const Lists = ({
  lists, selected, editing, context, parent, showListMenu, ...props
}) => {

  if (editing && editing.parent === parent) {
    var newListNode =
      <List {...props} list={editing} isEditing/>
  }

  return (
    <ol className="lists">
      {
        lists.map(list =>
          <List {...props}
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

Lists.propTypes = {
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
  Lists: connect(

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
        dispatch(nav.update({ list }))
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

  )(Lists)
}
