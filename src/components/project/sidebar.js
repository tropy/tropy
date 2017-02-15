'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { FormattedMessage } = require('react-intl')
const { Toolbar } = require('../toolbar')
const { ActivityPane } = require('../activity')
const { ListTree, TrashListNode } = require('../list')
const { TagList } = require('../tag')
const { Sidebar } = require('../sidebar')
const { ProjectName } = require('./name')
const { ROOT } = require('../../constants/list')
const { has } = require('../../common/util')
const { bool, shape, string, object, arrayOf, func } = PropTypes


class ProjectSidebar extends PureComponent {

  get isContext() {
    return has(this.props.context, 'project')
  }

  get isEditing() {
    return has(this.props.edit, 'project')
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
      nav,
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
              selection={nav.list}
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
    const {
      tags,
      edit,
      nav,
      onContextMenu,
      onEditCancel,
      onTagCreate,
      onTagSave,
      onTagSelect
    } = this.props

    return (
      <section onContextMenu={this.showTagsMenu}>
        <h2><FormattedMessage id="sidebar.tags"/></h2>
        <nav>
          <TagList
            tags={tags}
            selection={nav.tags}
            edit={edit.tag}
            onCancel={onEditCancel}
            onCreate={onTagCreate}
            onSave={onTagSave}
            onSelect={onTagSelect}
            onContextMenu={onContextMenu}/>
        </nav>
      </section>
    )
  }

  renderToolbar() {
    return this.props.hasToolbar ?
      <Toolbar onDoubleClick={this.props.onMaximize}/> :
      null

  }

  render() {
    return (
      <Sidebar>
        {this.renderToolbar()}
        <div className="sidebar-body" onContextMenu={this.showSidebarMenu}>
          <div tabIndex="0">
            {this.renderProject()}
            {this.renderLists()}
          </div>
          {this.renderTags()}
        </div>
        <ActivityPane/>
      </Sidebar>
    )
  }

  static propTypes = {
    hasToolbar: bool,

    project: shape({
      file: string,
      name: string
    }).isRequired,

    context: object.isRequired,
    edit: object.isRequired,
    nav: object.isRequired,
    lists: object.isRequired,
    tags: arrayOf(object).isRequired,

    onMaximize: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onContextMenu: func.isRequired,
    onItemDelete: func.isRequired,
    onItemImport: func.isRequired,
    onListItemsAdd: func.isRequired,
    onListSave: func.isRequired,
    onListSort: func.isRequired,
    onTagCreate: func.isRequired,
    onTagSave: func.isRequired,
    onTagSelect: func.isRequired,
    onProjectSave: func.isRequired,
    onSelect: func.isRequired
  }

  static defaultProps = {
    hasToolbar: ARGS.frameless
  }

  static props = Object.keys(ProjectSidebar.propTypes)
}


module.exports = {
  ProjectSidebar
}
