'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { arrayOf, func, number, object } = PropTypes
const { TagList, Tag } = require('../tag')


class ProjectTags extends PureComponent {

  handleContextMenu = (event, tag) => {
    this.props.onContextMenu(event, 'tag', tag.id)
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
          selection={this.props.selection}
          edit={this.props.edit}
          onEditCancel={this.props.onEditCancel}
          onCreate={this.props.onCreate}
          onSave={this.props.onSave}
          onSelect={this.props.onSelect}
          onContextMenu={this.handleContextMenu}/>
        {this.renderNewTag()}
      </nav>
    )
  }

  static propTypes = {
    edit: object,
    selection: arrayOf(number).isRequired,
    tags: arrayOf(object).isRequired,
    onContextMenu: func.isRequired,
    onCreate: func.isRequired,
    onEditCancel: func.isRequired,
    onSave: func.isRequired,
    onSelect: func.isRequired,
  }
}

module.exports = {
  ProjectTags
}
