'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { FormattedMessage } = require('react-intl')
const { Toolbar } = require('../toolbar')
const { ActivityPane } = require('../activity')
const { ListTree, TrashListNode } = require('../list')
const { TagList } = require('../tag')
const { Sidebar } = require('../sidebar')
const { ProjectName } = require('./name')
const { ROOT } = require('../../constants/list')
const { has } = require('../../common/util')


class ProjectSidebar extends Component {

  get isContext() {
    return has(this.props, 'ui.context.project')
  }

  get isEditing() {
    return has(this.props, 'ui.edit.project')
  }

  get isSelected() {
    return !(this.props.nav.list || this.props.nav.trash)
  }

  get isTrashSelected() {
    return this.props.nav.trash
  }


  handleProjectNameChange = (name) => {
    this.props.onProjectSave({ name })
  }

  showSidebarMenu = (event) => {
    this.props.onContextMenu(event, 'sidebar')
  }

  showProjectMenu = (event) => {
    this.props.onContextMenu(
      event, 'project', { path: this.props.project.file }
    )
  }

  showListsMenu = (event) => {
    this.props.onContextMenu(event, 'lists')
  }

  showTagsMenu = (event) => {
    this.props.onContextMenu(event, 'tags')
  }


  renderProject() {
    const {
      project,
      onItemImport,
      onEdit,
      onEditCancel,
      onSelect
    } = this.props

    return (
      <section onContextMenu={this.showProjectMenu}>
        <nav>
          <ol>
            <ProjectName
              name={project.name}
              isSelected={this.isSelected}
              isEditing={this.isEditing}
              isContext={this.isContext}
              onEdit={onEdit}
              onEditCancel={onEditCancel}
              onChange={this.handleProjectNameChange}
              onDrop={onItemImport}
              onSelect={onSelect}/>
          </ol>
        </nav>
      </section>
    )
  }

  renderLists() {
    const {
      lists,
      onItemImport,
      onItemDelete,
      onListSort,
      onListItemsAdd,
      ...props
    } = this.props

    const root = lists[ROOT]

    return (
      <section onContextMenu={this.showListsMenu}>
        <h2><FormattedMessage id="sidebar.lists"/></h2>
        <nav>
          {root &&
            <ListTree {...props}
              parent={root}
              lists={lists}
              onDropItems={onListItemsAdd}
              onDropFiles={onItemImport}
              onSort={onListSort}/>
          }

          <ol>
            <TrashListNode {...props}
              isSelected={this.isTrashSelected}
              onDropItems={onItemDelete}/>
          </ol>
        </nav>
      </section>
    )
  }

  renderTags() {
    const { tags, onContextMenu } = this.props

    return (
      <section onContextMenu={this.showTagsMenu}>
        <h2><FormattedMessage id="sidebar.tags"/></h2>
        <nav>
          <TagList tags={tags} onContextMenu={onContextMenu}/>
        </nav>
      </section>
    )
  }

  renderToolbar() {
    return this.props.hasToolbar ?
      <Toolbar {...this.props} draggable/> :
      null

  }

  render() {
    return (
      <Sidebar>
        {this.renderToolbar()}
        <div className="sidebar-body" onContextMenu={this.showSidebarMenu}>
          {this.renderProject()}
          {this.renderLists()}
          {this.renderTags()}
        </div>
        <ActivityPane/>
      </Sidebar>
    )
  }

  static propTypes = {
    hasToolbar: PropTypes.bool,

    project: PropTypes.shape({
      file: PropTypes.string,
      name: PropTypes.string
    }).isRequired,

    ui: PropTypes.object.isRequired,
    nav: PropTypes.object.isRequired,
    lists: PropTypes.object.isRequired,
    tags: PropTypes.arrayOf(PropTypes.object).isRequired,

    onMaximize: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onEditCancel: PropTypes.func.isRequired,
    onContextMenu: PropTypes.func.isRequired,
    onItemDelete: PropTypes.func.isRequired,
    onItemImport: PropTypes.func.isRequired,
    onListItemsAdd: PropTypes.func.isRequired,
    onListSave: PropTypes.func.isRequired,
    onListSort: PropTypes.func.isRequired,
    onProjectSave: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired
  }
}


module.exports = {
  ProjectSidebar
}
