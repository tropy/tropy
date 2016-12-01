'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { Editable } = require('./editable')
const { IconTag } = require('./icons')
const get = require('../selectors/tag')
const act = require('../actions')
const { meta } = require('../common/os')
const cn = require('classnames')


class Tag extends Component {

  update = (name) => {
    this.props.onUpdate(this.props.tag.id, { name })
  }

  select = (event) => {
    const { tag, isSelected, onSelect } =  this.props

    onSelect(tag.id, isSelected ?
      (meta(event) ? 'remove' : 'clear') :
      (meta(event) ? 'merge' : 'replace'))
  }

  popup = (event) => {
    this.props.onContextMenu(event, this.props.tag.id)
  }

  render() {
    const {
      tag, isSelected, context, isEditing, onCancel
    } = this.props

    return (
      <li
        className={cn({ tag: true, active: isSelected, context })}
        onContextMenu={this.popup}
        onClick={this.select}>
        <IconTag/>
        <div className="name">
          <Editable
            value={tag.name}
            isRequired
            isEditing={isEditing}
            onCancel={onCancel}
            onChange={this.update}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    tag: PropTypes.object,

    isEditing: PropTypes.bool,
    isSelected: PropTypes.bool,
    context: PropTypes.bool,

    onSelect: PropTypes.func,
    onContextMenu: PropTypes.func,
    onCancel: PropTypes.func,
    onUpdate: PropTypes.func
  }
}


const Tags = ({
  tags, selection, editing, context, onSelect, showTagMenu, ...props
}) => {

  if (editing && !editing.id) {
    var newTagListItem =
      <Tag {...props} tag={editing} isEditing/>
  }

  return (
    <ol className="tags">
      {
        tags.map(tag =>
          <Tag {...props}
            key={tag.id}
            tag={tag}
            isSelected={selection.includes(tag.id)}
            isEditing={editing && editing.id === tag.id}
            context={context === tag.id}
            onContextMenu={showTagMenu}
            onSelect={onSelect}/>)
      }
      {newTagListItem}
    </ol>
  )
}

Tags.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.object),
  selection: PropTypes.arrayOf(PropTypes.number),
  context: PropTypes.number,
  editing: PropTypes.object,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func,
  onUpdate: PropTypes.func,
  showTagMenu: PropTypes.func
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

      onUpdate(id, values) {
        dispatch(act.ui.edit.cancel())
        dispatch(id ?
          act.tag.save({ id, ...values }) :
          act.tag.create({ ...values }))
      },

      showTagMenu(event, target) {
        event.stopPropagation()
        dispatch(act.ui.context.show(event, 'tag', target))
      }
    })
  )(Tags)
}
