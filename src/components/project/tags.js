'use strict'

const React = require('react')
const { PureComponent } = React
const { connect } = require('react-redux')
const { arrayOf, func, number, object } = require('prop-types')
const { TagList, Tag } = require('../tag')
const { getAllTags } = require('../../selectors')


class ProjectTags extends PureComponent {

  handleContextMenu = (event, tag) => {
    this.props.onContextMenu(event, 'tag', {
      id: tag.id,
      color: tag.color
    })
  }

  handleDelete = (tag) => {
    this.props.onDelete(tag.id)
  }

  renderNewTag() {
    const { edit, onCreate, onEditCancel } = this.props
    const hasNewTag = (edit != null && edit.id == null)

    return hasNewTag && (
      <ol>
        <Tag
          tag={edit}
          isEditing
          onChange={onCreate}
          onEditCancel={onEditCancel}/>
      </ol>
    )
  }

  render() {
    return (
      <nav className="project-tags">
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
        {this.renderNewTag()}
      </nav>
    )
  }

  static propTypes = {
    edit: object,
    keymap: object.isRequired,
    selection: arrayOf(number).isRequired,
    tags: arrayOf(object).isRequired,
    onContextMenu: func.isRequired,
    onCreate: func.isRequired,
    onDelete: func.isRequired,
    onDropItems: func.isRequired,
    onEditCancel: func.isRequired,
    onSave: func.isRequired,
    onSelect: func.isRequired,
  }
}

module.exports = {
  ProjectTags: connect(
    state => ({
      tags: getAllTags(state)
    })
  )(ProjectTags)
}
