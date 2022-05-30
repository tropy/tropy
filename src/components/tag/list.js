import React from 'react'
import { NewTag, Tag } from './tag'
import { get, noop, pick, sample } from '../../common/util'
import { SASS } from '../../constants'
import { match } from '../../keymap'
import { arrayOf, bool, number, string, shape, object, func } from 'prop-types'


export class TagList extends React.PureComponent {
  get hasNewTag() {
    return !this.props.isReadOnly &&
      this.props.onCreate != null &&
      this.props.edit != null &&
      this.props.edit.id == null
  }

  get color() {
    return (this.props.color === 'random') ?
      sample(this.props.colors) : this.props.color
  }

  isEditing(tag) {
    return get(this.props.edit, ['id']) === tag.id
  }

  isSelected(tag) {
    return this.props.selection.includes(tag.id)
  }

  handleContextMenu = (event, tag) => {
    if (!this.isSelected(tag) || this.props.selection.length > 1) {
      this.props.onSelect(tag.id, { mod: 'replace' })
    }

    this.props.onContextMenu(event,
      'tag',
      pick(tag, ['id', 'color', 'mixed']))
  }

  handleKeyDown = (event, tag) => {
    if (this.props.isReadOnly)
      return

    switch (match(this.props.keymap, event)) {
      case 'remove':
        this.props.onRemove(tag)
        break
      case 'edit':
        this.props.onEdit(tag)
        break
      case 'commit':
        this.props.onCommit(tag)
        break
      case 'clear':
        this.props.onSelect(tag.id, { mod: 'clear' })
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }

  render() {
    return (
      <ol className="tag-list">
        {this.props.tags.map(tag =>
          <Tag
            key={tag.id}
            tag={tag}
            hasFocusIcon={this.props.hasFocusIcon}
            isEditing={this.isEditing(tag)}
            isReadOnly={this.props.isReadOnly}
            isSelected={this.isSelected(tag)}
            onChange={this.props.onSave}
            onDropItems={this.props.onDropItems}
            onEditCancel={this.props.onEditCancel}
            onFocusClick={this.props.onCommit}
            onKeyDown={this.handleKeyDown}
            onSelect={this.props.onSelect}
            onContextMenu={this.handleContextMenu}/>)}
        {this.hasNewTag &&
          <NewTag
            color={this.color}
            onCreate={this.props.onCreate}
            onCancel={this.props.onEditCancel}
            name={this.props.edit.name}/>}
      </ol>
    )
  }

  static propTypes = {
    color: string,
    colors: arrayOf(string).isRequired,
    edit: object,
    hasFocusIcon: bool,
    isReadOnly: bool,
    keymap: object.isRequired,
    selection: arrayOf(number).isRequired,
    tags: arrayOf(shape({
      id: number.isRequired,
      name: string.isRequired
    })).isRequired,
    onCommit: func.isRequired,
    onContextMenu: func.isRequired,
    onCreate: func,
    onDropItems: func,
    onEdit: func,
    onEditCancel: func,
    onRemove: func.isRequired,
    onSave: func,
    onSelect: func.isRequired
  }

  static defaultProps = {
    colors: SASS.TAG.COLORS,
    selection: [],
    onCommit: noop,
    onEdit: noop,
    onSelect: noop
  }
}
