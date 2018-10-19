'use strict'

const React = require('react')
const { arrayOf, func, number, object } = require('prop-types')
const { NewTag, TagList } = require('../tag')

class ProjectTags extends React.PureComponent {
  get hasNewTag() {
    return this.props.edit != null && this.props.edit.id == null
  }

  handleContextMenu = (event, tag) => {
    this.props.onContextMenu(event, 'tag', {
      id: tag.id,
      color: tag.color
    })
  }

  handleDelete = (tag) => {
    this.props.onDelete(tag.id)
  }

  render() {
    return (
      <nav>
        <TagList
          tags={this.props.tags}
          keymap={this.props.keymap}
          selection={this.props.selection}
          edit={this.props.edit}
          onCreate={this.props.onCreate}
          onDropItems={this.props.onDropItems}
          onEditCancel={this.props.onEditCancel}
          onRemove={this.handleDelete}
          onSave={this.props.onSave}
          onSelect={this.props.onSelect}
          onContextMenu={this.handleContextMenu}/>
        {this.hasNewTag &&
          <NewTag
            onCreate={this.props.onCreate}
            onCancel={this.props.onEditCancel}
            name={this.props.edit.name}/>}
      </nav>
    )
  }

  static propTypes = {
    edit: object,
    keymap: object.isRequired,
    onContextMenu: func.isRequired,
    onCreate: func.isRequired,
    onDelete: func.isRequired,
    onDropItems: func.isRequired,
    onEditCancel: func.isRequired,
    onSave: func.isRequired,
    onSelect: func.isRequired,
    selection: arrayOf(number).isRequired,
    tags: arrayOf(object).isRequired
  }
}

module.exports = {
  ProjectTags
}
