'use strict'

const React = require('react')

const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { Editable } = require('./editable')
const { IconTag } = require('./icons')
const get = require('../selectors/tag')
const act = require('../actions')
const { noop } = require('../common/util')
const cn = require('classnames')


class Tag extends Component {

  static propTypes = {
    tag: PropTypes.object,
    active: PropTypes.bool,
    context: PropTypes.bool,
    editing: PropTypes.bool,
    onActivate: PropTypes.func,
    onCancel: PropTypes.func,
    onContextMenu: PropTypes.func,
    onRename: PropTypes.func,
    onUpdate: PropTypes.func
  }

  static defaultProps = {
    onActivate: noop,
    onCancel: noop,
    onContextMenu: noop,
    onRename: noop,
    onUpdate: noop
  }

  update = (name) => {
    this.props.onUpdate(this.props.tag.id, { name })
  }

  activate = () => {
    if (!this.props.active) {
      this.props.onActivate(this.props.tag.id)
    }
  }

  rename = () => {
    this.props.onRename(this.props.tag.id)
  }

  cancel = () => {
    this.props.onCancel(this.props.tag.id)
  }

  popup = (event) => {
    this.props.onContextMenu(event, this.props.tag.id)
  }

  render() {
    const { tag, active, context, editing } = this.props

    return (
      <li
        className={cn({ tag: true, active, context })}
        onContextMenu={this.popup}
        onClick={this.activate}>
        <IconTag/>
        <div className="name">
          <Editable
            value={tag.name}
            required
            editing={editing}
            onActivate={this.rename}
            onChange={this.update}
            onCancel={this.cancel}/>
        </div>
      </li>
    )
  }
}


const Tags = ({
  tags,
  selected,
  onUpdate,
  onCancel,
  onSelect,
  onRename,
  onContextMenu,
  editing,
  context
}) => (
  <ol className="tags">
    {
      tags.map(tag => (
        <Tag
          key={tag.id}
          active={selected === tag.id}
          context={context === tag.id}
          editing={editing && editing.id === tag.id}
          tag={tag}
          onContextMenu={onContextMenu}
          onUpdate={onUpdate}
          onActivate={onSelect}
          onRename={onRename}
          onCancel={onCancel}/>
      ))
    }
    {
      editing && !editing.id ? (
        <Tag
          key={-1}
          tag={editing}
          editing
          onUpdate={onUpdate}
          onCancel={onCancel}/>
      ) : undefined
    }
  </ol>
)

Tags.propTypes = {
  tags: PropTypes.array,
  selected: PropTypes.number,
  context: PropTypes.number,
  editing: PropTypes.object,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func,
  onRename: PropTypes.func,
  onUpdate: PropTypes.func,
  onContextMenu: PropTypes.func
}

module.exports = {
  Tags: connect(

    (state) => ({
      selected: state.nav.list,
      context: state.ui.context.tag,
      editing: state.ui.edit.tag,
      tags: get.visible(state)
    }),

    (dispatch) => ({
      onCancel() {
        dispatch(act.ui.edit.cancel())
      },

      onSelect(tag) {
        dispatch(act.nav.update({ tag }))
      },

      onRename(id) {
        dispatch(act.tag.edit({ id }))
      },

      onUpdate(id, values) {
        dispatch(act.ui.edit.cancel())
        dispatch(id ?
          act.tag.save({ id, ...values }) :
          act.tag.create({ ...values }))
      },

      onContextMenu(event, target) {
        event.stopPropagation()
        dispatch(act.ui.context.show(event, 'tag', target))
      }
    })

  )(Tags)
}
