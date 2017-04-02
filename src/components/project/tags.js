'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { arrayOf, func, number, object } = PropTypes
const { TagList } = require('../tag')


class ProjectTags extends PureComponent {

  handleContextMenu = (event, tag) => {
    this.props.onContextMenu(event, 'tag', tag.id)
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
