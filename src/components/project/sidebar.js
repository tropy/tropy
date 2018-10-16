'use strict'

const React = require('react')
const { connect } = require('react-redux')
const { FormattedMessage } = require('react-intl')
const { Toolbar } = require('../toolbar')
const { ActivityPane } = require('../activity')
const { LastImportListNode, ListTree, TrashListNode } = require('../list')
const { ProjectTags } = require('./tags')
const { Sidebar } = require('../sidebar')
const { ProjectName } = require('./name')
const { TABS, LIST } = require('../../constants')
const { has, last } = require('../../common/util')
const { match } = require('../../keymap')
const { testFocusChange } = require('../../dom')
const actions = require('../../actions')

const {
  bool, shape, string, object, arrayOf, func, number
} = require('prop-types')

const {
  getActivities,
  getListSubTree
} = require('../../selectors')


class ProjectSidebar extends React.PureComponent {
  get isEditing() {
    return has(this.props.edit, 'project')
  }

  get hasActiveFilters() {
    return this.props.tagSelection.length > 0
  }

  get hasSelection() {
    return this.props.listSelection != null ||
      this.props.isTrashSelected ||
      this.props.isLastImportSelected && this.props.hasLastImport
  }

  get tabIndex() {
    return (this.props.isActive) ? TABS.ProjectSidebar : null
  }

  getFirstList() {
    return this.props.listwalk[0]
  }

  getLastList() {
    return last(this.props.listwalk)
  }

  getNextList() {
    return this.getListAt(1)
  }

  getPrevList() {
    return this.getListAt(-1)
  }

  getListAt(offset = 1) {
    let list = this.props.listSelection
    let walk = this.props.listwalk

    let idx = walk.indexOf(list)
    if (idx < 0) return

    return walk[idx + offset]
  }

  isListSelected(list) {
    return list && list === this.props.listSelection
  }

  isListEmpty() {
    return this.props.listwalk.length === 0
  }

  next() {
    switch (true) {
      case this.props.isTrashSelected:
        return
      case this.props.isLastImportSelected:
        return this.handleTrashSelect()
      case this.isListEmpty():
      case this.isListSelected(this.getLastList()):
        return this.props.hasLastImport ?
          this.handleLastImportSelect() :
          this.handleTrashSelect()
      case !this.hasSelection:
        return this.handleListSelect(this.getFirstList())
      default:
        return this.handleListSelect(this.getNextList())
    }
  }

  prev() {
    switch (true) {
      case !this.hasSelection:
        return
      case this.props.isTrashSelected && this.props.hasLastImport:
        return this.handleLastImportSelect()
      case this.isListEmpty():
      case this.isListSelected(this.getFirstList()):
        return this.handleSelect()
      case this.props.isLastImportSelected:
        return this.handleListSelect(this.getLastList())
      case this.props.isTrashSelected:
        return this.props.hasLastImport ?
          this.handleLastImportSelect() :
          this.handleListSelect(this.getLastList())
      default:
        return this.handleListSelect(this.getPrevList())
    }
  }

  collapse() {
    if (this.props.listSelection != null) {
      this.props.onListCollapse(this.props.listSelection)
    }
  }

  expand() {
    if (this.props.listSelection != null) {
      this.props.onListExpand(this.props.listSelection)
    }
  }

  handleSelect() {
    this.props.onSelect({ list: null, trash: null }, { throttle: true })
  }

  handleMouseDown = () => {
    this.hasFocusChanged = testFocusChange()
  }

  handleClick = () => {
    if (this.hasSelection || this.hasActiveFilters) {
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
      case 'expand':
        this.expand()
        break
      case 'collapse':
        this.collapse()
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
  }

  handleContextMenu = (event) => {
    this.props.onContextMenu(event, 'sidebar')
  }

  render() {
    const {
      edit,
      project,
      onContextMenu,
      onEditCancel,
      onItemImport,
      onItemTagAdd,
      onTagCreate,
      onTagDelete,
      onTagSave,
      onTagSelect
    } = this.props

    let root = this.props.lists[this.props.root]

    return (
      <Sidebar>
        {this.props.hasToolbar &&
          <Toolbar onDoubleClick={this.props.onMaximize}/>}
        <div
          className="sidebar-body"
          onContextMenu={this.handleContextMenu}>

          <section
            tabIndex={this.tabIndex}
            onKeyDown={this.handleKeyDown}
            onMouseDown={this.handleMouseDown}>
            <nav>
              <ol>
                <ProjectName
                  name={project.name}
                  isSelected={!this.hasSelection}
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
                  lists={this.props.lists}
                  edit={this.props.edit.list}
                  expand={this.props.expand}
                  hold={this.props.hold}
                  selection={this.props.listSelection}
                  onContextMenu={onContextMenu}
                  onDropFiles={onItemImport}
                  onDropItems={this.props.onListItemsAdd}
                  onClick={this.handleListClick}
                  onEditCancel={onEditCancel}
                  onExpand={this.props.onListExpand}
                  onCollapse={this.props.onListCollapse}
                  onMove={this.props.onListMove}/>}
              <ol>
                {this.props.hasLastImport &&
                  <LastImportListNode
                    isSelected={this.props.isLastImportSelected}
                    onClick={this.handleLastImportSelect}/>}
                <TrashListNode
                  isSelected={this.props.isTrashSelected}
                  onContextMenu={onContextMenu}
                  onDropItems={this.handleTrashDropItems}
                  onClick={this.handleTrashSelect}/>
              </ol>
            </nav>
          </section>

          <section>
            <h2><FormattedMessage id="sidebar.tags"/></h2>
            <ProjectTags
              keymap={this.props.keymap.TagList}
              selection={this.props.tagSelection}
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
        <ActivityPane activities={this.props.activities}/>
      </Sidebar>
    )
  }

  static propTypes = {
    hasSelection: bool,
    isActive: bool,
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

    expand: object.isRequired,
    keymap: object.isRequired,
    activities: arrayOf(object).isRequired,
    edit: object.isRequired,
    lists: object.isRequired,
    listwalk: arrayOf(number).isRequired,
    listSelection: number,
    root: number.isRequired,
    tagSelection: arrayOf(number).isRequired,

    onMaximize: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onContextMenu: func.isRequired,
    onItemDelete: func.isRequired,
    onItemImport: func.isRequired,
    onItemTagAdd: func.isRequired,
    onListCollapse: func.isRequired,
    onListExpand: func.isRequired,
    onListItemsAdd: func.isRequired,
    onListMove: func.isRequired,
    onListSave: func.isRequired,
    onTagCreate: func.isRequired,
    onTagDelete: func.isRequired,
    onTagSave: func.isRequired,
    onTagSelect: func.isRequired,
    onProjectSave: func.isRequired,
    onSelect: func.isRequired
  }

  static defaultProps = {
    hasToolbar: ARGS.frameless,
    root: LIST.ROOT
  }

  static props = Object.keys(ProjectSidebar.propTypes)
}


module.exports = {
  ProjectSidebar: connect(
    (state, { root }) => ({
      activities: getActivities(state),
      edit: state.edit,
      expand: state.sidebar.expand,
      hasLastImport: state.imports.length > 0,
      isLastImportSelected: state.nav.imports,
      isTrashSelected: state.nav.trash,
      keymap: state.keymap,
      lists: state.lists,
      listSelection: state.nav.list,
      listwalk: getListSubTree(state, { root: root || LIST.ROOT }),
      tagSelection: state.nav.tags
    }),

    (dispatch) => ({
      onListCollapse(...args) {
        dispatch(actions.list.collapse(...args))
      },

      onListExpand(...args) {
        dispatch(actions.list.expand(...args))
      },

      onListItemsAdd({ list, items }) {
        dispatch(actions.list.items.add({
          id: list, items: items.map(item => item.id)
        }))
      },

      onListSave(...args) {
        dispatch(actions.list.save(...args))
        dispatch(actions.edit.cancel())
      },

      onListMove(...args) {
        dispatch(actions.list.move(...args))
      }
    })
  )(ProjectSidebar)
}
