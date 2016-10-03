'use strict'

const React = require('react')

const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { Editable } = require('./editable')
const { IconFolder } = require('./icons')
const { getChildren } = require('../selectors/list')
const { create, save, remove } = require('../actions/list')
const { edit } = require('../actions/ui')
const { ROOT } = require('../constants/list')
const { noop } = require('../common/util')
const nav = require('../actions/nav')
const ctx = require('../actions/context')
const cn = require('classnames')


class List extends Component {

  static propTypes = {
    list: PropTypes.object,
    active: PropTypes.bool,
    editing: PropTypes.bool,
    onCancel: PropTypes.func,
    onContextMenu: PropTypes.func,
    onSelect: PropTypes.func,
    onUpdate: PropTypes.func
  }

  static defaultProps = {
    onCancel: noop,
    onContextMenu: noop,
    onSelect: noop,
    onUpdate: noop
  }

  update = (name) => {
    this.props.onUpdate(this.props.list.id, { name })
  }

  select = () => {
    if (!this.props.active) {
      this.props.onSelect(this.props.list.id)
    }
  }

  cancel = () => {
    this.props.onCancel(this.props.list)
  }

  popup = (event) => {
    this.props.onContextMenu(event, this.props.list.id)
  }

  render() {
    const { list, active, editing } = this.props

    return (
      <li
        className={cn({ list: true, active })}
        onContextMenu={this.popup}
        onClick={this.select}>
        <IconFolder/>
        <div className="title">
          <Editable
            value={list.name}
            required
            editing={editing}
            onChange={this.update}
            onCancel={this.cancel}/>
        </div>
      </li>
    )
  }
}


const Lists = ({
  lists,
  selected,
  onUpdate,
  onCancel,
  onSelect,
  showListMenu,
  editing,
  parent
}) => (
  <ol className="lists">
    {
      lists.map(list => (
        <List
          key={list.id}
          active={selected === list.id}
          editing={editing && editing.id === list.id}
          list={list}
          onContextMenu={showListMenu}
          onUpdate={onUpdate}
          onSelect={onSelect}
          onCancel={onCancel}/>
      ))
    }
    {
      editing && editing.parent === parent ? (
        <List
          key={editing.parent}
          list={editing}
          editing
          onUpdate={onUpdate}
          onCancel={onCancel}/>
      ) : undefined
    }
  </ol>
)

Lists.propTypes = {
  lists: PropTypes.array,
  selected: PropTypes.number,
  parent: PropTypes.number,
  editing: PropTypes.object,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func,
  onUpdate: PropTypes.func,
  showListMenu: PropTypes.func
}

Lists.defaultProps = {
  parent: ROOT
}

module.exports = {
  Lists: connect(

    () => {
      const children = getChildren()

      return (state, props) => ({
        selected: state.nav.list,
        editing: state.ui.edit.list,
        lists: children(state, props)
      })
    },

    (dispatch, props) => ({
      onCancel(list) {
        dispatch(edit.cancel({ list }))
      },

      onSelect(list) {
        dispatch(nav.update({ list }))
      },

      onUpdate({ id, parent }, values) {
        dispatch(id ?
          save([id, values]) :
          create({ ...values, parent: props.parent }))
      },

      showListMenu(event, target) {
        event.stopPropagation()
        dispatch(ctx.show(event, 'list', target))
      }
    })

  )(Lists)
}
