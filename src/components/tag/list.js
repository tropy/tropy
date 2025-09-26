import React from 'react'
import { NewTag, Tag } from './tag.js'
import { ScrollContainer } from '../scroll/container.js'
import { get, noop, pick, sample } from '../../common/util.js'
import { SASS } from '../../constants/index.js'
import { match } from '../../keymap.js'


export class TagList extends React.PureComponent {
  get hasNewTag() {
    return !this.props.isReadOnly &&
      this.props.onCreate != null &&
      this.props.edit != null &&
      this.props.edit.id == null
  }

  get color() {
    return (this.props.color === 'random')
      ? sample(this.props.colors)
      : this.props.color
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
      <ScrollContainer>
        <ol className="tag-list">
          {this.props.tags.map(tag => (
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
              onContextMenu={this.handleContextMenu}/>
          ))}
          {this.hasNewTag && (
            <NewTag
              color={this.color}
              onCreate={this.props.onCreate}
              onCancel={this.props.onEditCancel}
              name={this.props.edit.name}/>
          )}
        </ol>
      </ScrollContainer>
    )
  }

  static defaultProps = {
    colors: SASS.TAG.COLORS,
    selection: [],
    onCommit: noop,
    onSelect: noop
  }
}
