'use strict'

const React = require('react')
const { NewTag, Tag } = require('./tag')
const { get, noop } = require('../../common/util')
const { match } = require('../../keymap')
const {
  arrayOf, bool, number, string, shape, object, func
} = require('prop-types')


class TagList extends React.PureComponent {
  get hasNewTag() {
    return this.props.onCreate != null &&
      this.props.edit != null && this.props.edit.id == null
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

    this.props.onContextMenu(event, tag)
  }

  handleKeyDown = (event, tag) => {
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
      <ol className="tag-list">
        {this.props.tags.map(tag =>
          <Tag
            key={tag.id}
            tag={tag}
            hasFocusIcon={this.props.hasFocusIcon}
            isEditing={this.isEditing(tag)}
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
            onCreate={this.props.onCreate}
            onCancel={this.props.onEditCancel}
            name={this.props.edit.name}/>}
      </ol>
    )
  }

  static propTypes = {
    edit: object,
    hasFocusIcon: bool,
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
    onEditCancel: func.isRequired,
    onRemove: func.isRequired,
    onSave: func.isRequired,
    onSelect: func.isRequired
  }

  static defaultProps = {
    selection: [],
    onCommit: noop,
    onSelect: noop
  }
}

module.exports = {
  TagList
}
