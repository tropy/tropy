'use strict'

const React = require('react')
const { connect } = require('react-redux')
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
const { getAllVisibleTags } = require('../../selectors/tag')
const act = require('../../actions')


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
    const { project, ...props } = this.props

    return (
      <section onContextMenu={this.showProjectMenu}>
        <nav>
          <ol>
            <ProjectName {...props}
              name={project.name}
              isSelected={this.isSelected}
              isEditing={this.isEditing}
              isContext={this.isContext}
              onChange={this.handleProjectNameChange}/>
          </ol>
        </nav>
      </section>
    )
  }

  renderLists() {
    const { lists, onItemsDelete, ...props } = this.props

    return (
      <section onContextMenu={this.showListsMenu}>
        <h2><FormattedMessage id="sidebar.lists"/></h2>
        <nav>
          <ListTree {...props} parent={lists[ROOT]} lists={lists}/>

          <ol>
            <TrashListNode {...props}
              isSelected={this.isTrashSelected}
              onDropItems={onItemsDelete}/>
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

    ui: PropTypes.object,
    nav: PropTypes.object,
    lists: PropTypes.object,
    tags: PropTypes.arrayOf(PropTypes.object),

    onMaximize: PropTypes.func,
    onSelect: PropTypes.func,
    onEdit: PropTypes.func,
    onEditCancel: PropTypes.func,
    onContextMenu: PropTypes.func,
    onItemsDelete: PropTypes.func,
    onListItemsAdd: PropTypes.func,
    onListSave: PropTypes.func,
    onProjectSave: PropTypes.func
  }
}



module.exports = {
  ProjectSidebar: connect(
    (state) => ({
      project: state.project,
      lists: state.lists,
      tags: getAllVisibleTags(state)
    }),

    (dispatch) => ({
      onSelect(opts) {
        dispatch(act.nav.select({ list: null, trash: null, ...opts }))
      }
    })
  )(ProjectSidebar)
}
