'use strict'

const React = require('react')
const { PureComponent } = React
const { FormattedMessage } = require('react-intl')
const { Toolbar } = require('../toolbar')
const { ActivityPane } = require('../activity')
const { LastImportListNode, ListTree, TrashListNode } = require('../list')
const { ProjectTags } = require('./tags')
const { Sidebar } = require('../sidebar')
const { ProjectName } = require('./name')
const { TABS, LIST } = require('../../constants')
const { has } = require('../../common/util')
const { match } = require('../../keymap')
const { testFocusChange } = require('../../dom')
const {
  bool, shape, string, object, arrayOf, func, number
} = require('prop-types')


class ProjectSidebar extends PureComponent {
  get isEditing() {
    return has(this.props.edit, 'project')
  }

  get hasActiveFilters() {
    return this.props.selectedTags.length > 0
  }

  get tabIndex() {
    return (this.props.isActive) ? TABS.ProjectSidebar : null
  }

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
    const {
      isSelected, isTrashSelected, hasLastImport, isLastImportSelected
    } = this.props

    switch (true) {
      case isTrashSelected:
        return
      case isLastImportSelected:
        return this.handleTrashSelect()
      case this.isListEmpty():
      case this.isListSelected(this.getLastList()):
        return hasLastImport ?
          this.handleLastImportSelect() :
          this.handleTrashSelect()
      case isSelected:
        return this.handleListSelect(this.getFirstList())
      default:
        return this.handleListSelect(this.getNextList())
    }
  }

  prev() {
    const {
      isSelected, isTrashSelected, hasLastImport, isLastImportSelected
    } = this.props

    switch (true) {
      case isSelected:
        return
      case isTrashSelected && hasLastImport:
        return this.handleLastImportSelect()
      case this.isListEmpty():
      case this.isListSelected(this.getFirstList()):
        return this.handleSelect()
      case isLastImportSelected:
        return this.handleListSelect(this.getLastList())
      case isTrashSelected:
        return hasLastImport ?
          this.handleLastImportSelect() :
          this.handleListSelect(this.getLastList())
      default:
        return this.handleListSelect(this.getPrevList())
    }
  }

  handleSelect() {
    this.props.onSelect({ list: null, trash: null }, { throttle: true })
  }


  handleMouseDown = () => {
    this.hasFocusChanged = testFocusChange()
  }

  handleClick = () => {
    if (!this.props.isSelected || this.hasActiveFilters) {
      return this.handleSelect()
    }

    if (!this.hasFocusChanged()) {
      this.props.onEdit({
        project: { name: this.props.project.name }
      })
    }
  }

  handleChange = (name) => {
    this.props.onProjectSave({ name })
  }

  handleTrashSelect = () => {
    this.props.onSelect({ trash: true }, { throttle: true })
  }

  handleLastImportSelect = () => {
    this.props.onSelect({ imports: true }, { throttle: true })
  }

  handleTrashDropItems = (items) => {
    this.props.onItemDelete(items.map(it => it.id))
  }

  handleListClick = (list) => {
    if (!this.handleListSelect(list.id)) {
      if (!this.hasFocusChanged()) {
        this.props.onEdit({ list: { id: list.id } })
      }
    }
  }

  handleListSelect = (list) => {
    if (list && (!this.isListSelected(list) || this.hasActiveFilters)) {
      this.props.onSelect({ list }, { throttle: true })
      return true
    }
  }

  handleKeyDown = (event) => {
    switch (match(this.props.keymap.Sidebar, event)) {
      case 'prev':
        this.prev()
        break
      case 'next':
        this.next()
        break
      case 'clear':
        this.handleSelect()
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
      edit,
      hasLastImport,
      hasToolbar,
      hold,
      isSelected,
      isLastImportSelected,
      isTrashSelected,
      keymap,
      lists,
      project,
      selectedList,
      selectedTags,
      onContextMenu,
      onEditCancel,
      onItemImport,
      onItemTagAdd,
      onListItemsAdd,
      onListSave,
      onListSort,
      onMaximize,
      onTagCreate,
      onTagDelete,
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
            onKeyDown={this.handleKeyDown}
            onMouseDown={this.handleMouseDown}>
            <nav onContextMenu={this.showProjectMenu}>
              <ol>
                <ProjectName
                  name={project.name}
                  isSelected={isSelected}
                  isEditing={this.isEditing}
                  onChange={this.handleChange}
                  onClick={this.handleClick}
                  onEditCancel={onEditCancel}
                  onDrop={onItemImport}/>
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
                  edit={edit.list}
                  hold={hold}
                  selection={selectedList}
                  onContextMenu={onContextMenu}
                  onDropFiles={onItemImport}
                  onDropItems={onListItemsAdd}
                  onClick={this.handleListClick}
                  onEditCancel={onEditCancel}
                  onListSave={onListSave}
                  onSort={onListSort}/>}
              <ol>
                {hasLastImport &&
                  <LastImportListNode
                    isSelected={isLastImportSelected}
                    onClick={this.handleLastImportSelect}/>}
                <TrashListNode
                  isSelected={isTrashSelected}
                  onContextMenu={onContextMenu}
                  onDropItems={this.handleTrashDropItems}
                  onClick={this.handleTrashSelect}/>
              </ol>
            </nav>
          </section>

          <section>
            <h2><FormattedMessage id="sidebar.tags"/></h2>
            <ProjectTags
              keymap={keymap.TagList}
              selection={selectedTags}
              edit={edit.tag}
              onEditCancel={onEditCancel}
              onCreate={onTagCreate}
              onDelete={onTagDelete}
              onDropItems={onItemTagAdd}
              onSave={onTagSave}
              onSelect={onTagSelect}
              onContextMenu={onContextMenu}/>
          </section>

        </div>
        <ActivityPane activities={activities}/>
      </Sidebar>
    )
  }

  static propTypes = {
    isActive: bool,
    isSelected: bool,
    isLastImportSelected: bool,
    isTrashSelected: bool,
    hasLastImport: bool.isRequired,
    hasToolbar: bool,
    hold: object.isRequired,

    project: shape({
      file: string,
      name: string,
      items: number
    }).isRequired,

    keymap: object.isRequired,
    activities: arrayOf(object).isRequired,
    edit: object.isRequired,
    lists: object.isRequired,
    selectedList: number,
    selectedTags: arrayOf(number).isRequired,

    onMaximize: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onContextMenu: func.isRequired,
    onItemDelete: func.isRequired,
    onItemImport: func.isRequired,
    onItemTagAdd: func.isRequired,
    onListItemsAdd: func.isRequired,
    onListSave: func.isRequired,
    onListSort: func.isRequired,
    onTagCreate: func.isRequired,
    onTagDelete: func.isRequired,
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
