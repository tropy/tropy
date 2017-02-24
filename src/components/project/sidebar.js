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
const { STYLE, LIST } = require('../../constants')
const { has } = require('../../common/util')
const { bool, shape, string, object, arrayOf, func, number } = PropTypes


class ProjectSidebar extends PureComponent {

  get isContext() {
    return has(this.props.context, 'project')
  }

  get isEditing() {
    return has(this.props.edit, 'project')
  }

  tabIndex = STYLE.TABS.ProjectSidebar


  getRootList() {
    return this.props.lists[LIST.ROOT]
  }

  getFirstList() {
    const root = this.getRootList()
    return root && root.children[0]
  }

  getLastList() {
    const root = this.getRootList()
    return root && root.children[root.children.length - 1]
  }

  getNextList() {
    return this.getListAt(1)
  }

  getPrevList() {
    return this.getListAt(-1)
  }

  getListAt(offset = 1) {
    const root = this.getRootList()
    const list = this.props.selectedList

    if (!root || !list) return

    const idx = root.children.indexOf(list)

    if (idx < 0) return

    return root.children[idx + offset]
  }

  isListSelected(list) {
    return list && list === this.props.selectedList
  }

  isListEmpty() {
    const root = this.getRootList()
    return root.children.length === 0
  }


  next() {
    switch (true) {
      case this.props.isTrashSelected:
        return
      case this.isListEmpty():
      case this.isListSelected(this.getLastList()):
        return this.handleTrashSelect()
      case this.props.isSelected:
        return this.handleListSelect(this.getFirstList())
      default:
        return this.handleListSelect(this.getNextList())
    }
  }

  prev() {
    switch (true) {
      case this.props.isSelected:
        return
      case this.isListEmpty():
      case this.isListSelected(this.getFirstList()):
        return this.handleSelect()
      case this.props.isTrashSelected:
        return this.handleListSelect(this.getLastList())
      default:
        return this.handleListSelect(this.getPrevList())
    }
  }


  handleEdit = () => {
    this.props.onEdit({
      project: { name: this.props.project.name }
    })
  }

  handleChange = (name) => {
    this.props.onProjectSave({ name })
  }

  handleSelect = () => {
    this.props.onSelect({ list: null, trash: null }, { throttle: true })
  }

  handleTrashSelect = () => {
    this.props.onSelect({ trash: true }, { throttle: true })
  }

  handleListSelect = (list) => {
    if (list && !this.isListSelected(list)) {
      this.props.onSelect({ list }, { throttle: true })
    }
  }


  handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowUp':
        this.prev()
        break

      case 'ArrowDown':
        this.next()
        break

      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
  }


  showSidebarMenu = (event) => {
    this.props.onContextMenu(event, 'sidebar')
  }

  showProjectMenu = (event) => {
    this.props.onContextMenu(
      event, 'project', { path: this.props.project.file }
    )
  }

  render() {
    const {
      activities,
      context,
      edit,
      hasToolbar,
      isSelected,
      isTrashSelected,
      lists,
      project,
      tags,
      selectedList,
      selectedTags,
      onContextMenu,
      onEdit,
      onEditCancel,
      onItemDelete,
      onItemImport,
      onListItemsAdd,
      onListSave,
      onListSort,
      onMaximize,
      onSelect,
      onTagCreate,
      onTagSave,
      onTagSelect
    } = this.props

    const root = this.getRootList()

    return (
      <Sidebar>
        {hasToolbar && <Toolbar onDoubleClick={onMaximize}/>}
        <div className="sidebar-body" onContextMenu={this.showSidebarMenu}>

          <section
            tabIndex={this.tabIndex}
            onKeyDown={this.handleKeyDown}>
            <nav onContextMenu={this.showProjectMenu}>
              <ol>
                <ProjectName
                  name={project.name}
                  isSelected={isSelected}
                  isEditing={this.isEditing}
                  isContext={this.isContext}
                  onEdit={this.handleEdit}
                  onEditCancel={onEditCancel}
                  onChange={this.handleChange}
                  onDrop={onItemImport}
                  onSelect={this.handleSelect}/>
              </ol>
            </nav>

            <h3>
              <FormattedMessage id="sidebar.lists"/>
            </h3>
            <nav>
              {root &&
                <ListTree
                  parent={root}
                  lists={lists}
                  context={context.list}
                  edit={edit.list}
                  selection={selectedList}
                  onContextMenu={onContextMenu}
                  onDropFiles={onItemImport}
                  onDropItems={onListItemsAdd}
                  onEdit={onEdit}
                  onEditCancel={onEditCancel}
                  onListSave={onListSave}
                  onSelect={onSelect}
                  onSort={onListSort}/>}
              <ol>
                <TrashListNode
                  isSelected={isTrashSelected}
                  onContextMenu={onContextMenu}
                  onDropItems={onItemDelete}
                  onClick={this.handleTrashSelect}/>
              </ol>
            </nav>
          </section>

          <section>
            <h2><FormattedMessage id="sidebar.tags"/></h2>
            <nav>
              <TagList
                tags={tags}
                selection={selectedTags}
                edit={edit.tag}
                onCancel={onEditCancel}
                onCreate={onTagCreate}
                onSave={onTagSave}
                onSelect={onTagSelect}
                onContextMenu={onContextMenu}/>
            </nav>
          </section>

        </div>
        <ActivityPane activities={activities}/>
      </Sidebar>
    )
  }

  static propTypes = {
    isSelected: bool,
    isTrashSelected: bool,
    hasToolbar: bool,

    project: shape({
      file: string,
      name: string
    }).isRequired,

    activities: arrayOf(object).isRequired,
    context: object.isRequired,
    edit: object.isRequired,
    lists: object.isRequired,
    tags: arrayOf(object).isRequired,
    selectedList: number,
    selectedTags: arrayOf(number).isRequired,

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
