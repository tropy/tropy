'use strict'

const React = require('react')

const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { Editable } = require('./editable')
const { IconTag } = require('./icons')
const get = require('../selectors/tag')
const act = require('../actions')
const { noop } = require('../common/util')
const { meta } = require('../common/os')
const cn = require('classnames')


class Tag extends Component {
  constructor(props) {
    super(props)
  }

  update = (name) => {
    this.props.onUpdate(this.props.tag.id, { name })
  }

  select = (event) => {
    const { tag, selected, onSelect } =  this.props

    onSelect(tag.id, selected ?
      (meta(event) ? 'remove' : 'clear') :
      (meta(event) ? 'merge' : 'replace'))
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
    const { tag, selected, context, isEditing } = this.props

    return (
      <li
        className={cn({ tag: true, active: selected, context })}
        onContextMenu={this.popup}
        onClick={this.select}>
        <IconTag/>
        <div className="name">
          <Editable
            value={tag.name}
            isRequired
            isEditing={isEditing}
            onActivate={this.rename}
            onChange={this.update}
            onCancel={this.cancel}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    tag: PropTypes.object,
    selected: PropTypes.bool,
    context: PropTypes.bool,
    isEditing: PropTypes.bool,
    onSelect: PropTypes.func,
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

}


const Tags = ({
  tags,
  selection,
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
          selected={selection.includes(tag.id)}
          context={context === tag.id}
          isEditing={editing && editing.id === tag.id}
          tag={tag}
          onContextMenu={onContextMenu}
          onUpdate={onUpdate}
          onSelect={onSelect}
          onRename={onRename}
          onCancel={onCancel}/>
      ))
    }
    {
      editing && !editing.id ? (
        <Tag
          key={-1}
          tag={editing}
          isEditing
          onUpdate={onUpdate}
          onCancel={onCancel}/>
      ) : undefined
    }
  </ol>
)

Tags.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.object),
  selection: PropTypes.arrayOf(PropTypes.number),
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
      selection: state.nav.tags,
      context: state.ui.context.tag,
      editing: state.ui.edit.tag,
      tags: get.visible(state)
    }),

    (dispatch) => ({
      onCancel() {
        dispatch(act.ui.edit.cancel())
      },

      onSelect(id, mod) {
        dispatch(act.tag.select(id, { mod }))
      },

      onRename(id) {
        dispatch(act.ui.edit.start({ tag: { id } }))
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
