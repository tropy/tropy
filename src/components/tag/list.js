'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { Tag } = require('./tag')
const { get } = require('../../common/util')
const { arrayOf, number, string, shape, object, func } = PropTypes


class TagList extends PureComponent {

  get hasNewTag() {
    return this.props.edit && !this.props.edit.id
  }

  isEditing(tag) {
    return get(this.props.edit, ['id']) === tag.id
  }

  isSelected(tag) {
    return this.props.selection.includes(tag.id)
  }


  renderNewTag() {
    const { edit, onCreate, onCancel } = this.props

    return this.hasNewTag && (
      <Tag tag={edit} isEditing onChange={onCreate} onCancel={onCancel}/>
    )
  }

  handleContextMenu = (event, tag) => {
    const { selection, onSelect, onContextMenu } = this.props

    if (!this.isSelected(tag) || selection.length > 1) {
      onSelect(tag.id, { mod: 'replace' })
    }

    onContextMenu(event, 'tag', tag.id)
  }

  render() {
    const { tags, onCancel, onSelect, onSave } = this.props

    return (
      <ol className="tags">
        {tags.map(tag =>
          <Tag
            key={tag.id}
            tag={tag}
            isEditing={this.isEditing(tag)}
            isSelected={this.isSelected(tag)}
            onChange={onSave}
            onCancel={onCancel}
            onSelect={onSelect}
            onContextMenu={this.handleContextMenu}/>)}
        {this.renderNewTag()}
      </ol>
    )
  }
}

TagList.propTypes = {
  tags: arrayOf(
    shape({
      id: number.isRequired,
      name: string.isRequired
    })
  ).isRequired,

  selection: arrayOf(number).isRequired,
  edit: object,

  onCancel: func.isRequired,
  onSelect: func.isRequired,
  onCreate: func.isRequired,
  onSave: func.isRequired,
  onContextMenu: func.isRequired
}


module.exports = {
  TagList
}
