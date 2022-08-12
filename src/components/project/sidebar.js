import React from 'react'
import { connect } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { Titlebar } from '../toolbar'
import { ActivityPane } from '../activity'
import { Resizable } from '../resizable'
import { LastImportListNode, ListTree, TrashListNode } from '../list'
import { TagList } from '../tag'
import { Sidebar, SidebarBody } from '../sidebar'
import { ProjectName } from './name'
import { TABS, LIST, SASS } from '../../constants'
import { has } from '../../common/util'
import { match } from '../../keymap'
import { testFocusChange } from '../../dom'
import * as act from '../../actions'

import {
  bool, shape, string, object, arrayOf, func, number
} from 'prop-types'

import {
  getActivities,
  getAllTags,
  getListHold,
  getListSubTree
} from '../../selectors'


class ProjectSidebar extends React.PureComponent {
  get isEditing() {
    return has(this.props.edit, 'project')
  }

  get hasActiveTags() {
    return this.props.tagSelection.length > 0
  }

  get hasSelection() {
    return this.props.list != null ||
      this.props.isTrashSelected ||
      this.props.isLastImportSelected && this.props.hasLastImport
  }

  get tabIndex() {
    return (this.props.isDisabled) ? null : TABS.ProjectSidebar
  }

  getFirstList() {
    return this.props.listwalk[0]
  }

  getLastList() {
    return this.props.listwalk.at(-1)
  }

  getNextList() {
    return this.getListAt(1)
  }

  getPrevList() {
    return this.getListAt(-1)
  }

  getListAt(offset = 1) {
    let list = this.props.list
    let walk = this.props.listwalk

    let idx = walk.indexOf(list)
    if (idx < 0) return

    return walk[idx + offset]
  }

  isListSelected(list) {
    return list && list === this.props.list
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
    if (this.props.list != null) {
      this.props.onListCollapse(this.props.list)
    }
  }

  expand() {
    if (this.props.list != null) {
      this.props.onListExpand(this.props.list)
    }
  }

  edit() {
    if (this.props.project.isReadOnly)
      return
    if (!this.hasSelection)
      this.props.onProjectEdit()
    else if (this.props.list != null)
      this.props.onListEdit(this.props.list)
  }

  handleSelect() {
    this.props.onSelect({ list: null, trash: null }, { throttle: true })
  }

  handleMouseDown = () => {
    this.hasFocusChanged = testFocusChange()
  }

  handleClick = () => {
    if (this.hasSelection || this.hasActiveTags) {
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
    if (list && (!this.isListSelected(list) || this.hasActiveTags)) {
      this.props.onSelect({ list }, { throttle: true })
      return true
    }
  }

  handleTagEdit = (tag) => {
    this.props.onEdit({ tag: { id: tag.id } })
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
      case 'edit':
        this.edit()
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
  }

  handleContextMenu = (event, scope = 'sidebar', target) => {
    this.props.onContextMenu(event, scope, {
      ...target,
      isReadOnly: this.props.project.isReadOnly,
      tagColor: this.props.tagColor
    })
  }

  render() {
    let root = this.props.lists[this.props.root]

    return (
      <Resizable
        edge="right"
        isBuffered
        min={SASS.SIDEBAR.MIN_WIDTH}
        max={SASS.SIDEBAR.MAX_WIDTH}
        value={this.props.width}
        onChange={this.props.onResize}>
        <Sidebar>
          <Titlebar isOptional/>
          <SidebarBody onContextMenu={this.handleContextMenu}>
            <section
              tabIndex={this.tabIndex}
              onKeyDown={this.handleKeyDown}
              onMouseDown={this.handleMouseDown}>
              <nav>
                <ol>
                  <ProjectName
                    name={this.props.project.name}
                    isCorrupted={this.props.project.isCorrupted}
                    isReadOnly={this.props.project.isReadOnly}
                    isSelected={!this.hasSelection}
                    isEditing={this.isEditing}
                    onChange={this.handleChange}
                    onClick={this.handleClick}
                    onEditCancel={this.props.onEditCancel}
                    onDrop={this.props.onItemImport}/>
                </ol>
              </nav>

              <h3><FormattedMessage id="sidebar.lists"/></h3>
              <nav>
                {root &&
                  <ListTree
                    parent={root}
                    lists={this.props.lists}
                    edit={this.props.edit.list}
                    expand={this.props.expand}
                    hold={this.props.hold}
                    isExpanded
                    isReadOnly={this.props.project.isReadOnly}
                    selection={this.props.list}
                    onContextMenu={this.handleContextMenu}
                    onDropFiles={this.props.onItemImport}
                    onDropItems={this.props.onListItemsAdd}
                    onClick={this.handleListClick}
                    onEditCancel={this.props.onEditCancel}
                    onExpand={this.props.onListExpand}
                    onCollapse={this.props.onListCollapse}
                    onMove={this.props.onListMove}
                    onSave={this.props.onListSave}/>}
                <ol>
                  {this.props.hasLastImport &&
                    <LastImportListNode
                      isSelected={this.props.isLastImportSelected}
                      onClick={this.handleLastImportSelect}/>}
                  <TrashListNode
                    isSelected={this.props.isTrashSelected}
                    onContextMenu={this.handleContextMenu}
                    onDropItems={this.handleTrashDropItems}
                    onClick={this.handleTrashSelect}/>
                </ol>
              </nav>
            </section>

            <section>
              <h2><FormattedMessage id="sidebar.tags"/></h2>
              <nav>
                <TagList
                  color={this.props.tagColor}
                  edit={this.props.edit.tag}
                  isReadOnly={this.props.project.isReadOnly}
                  keymap={this.props.keymap.TagList}
                  selection={this.props.tagSelection}
                  tags={this.props.tags}
                  onContextMenu={this.handleContextMenu}
                  onCreate={this.props.onTagCreate}
                  onDropItems={this.props.onItemTagAdd}
                  onEdit={this.handleTagEdit}
                  onEditCancel={this.props.onEditCancel}
                  onRemove={this.props.onTagDelete}
                  onSave={this.props.onTagSave}
                  onSelect={this.props.onTagSelect}/>
              </nav>
            </section>

          </SidebarBody>
          <ActivityPane
            activities={this.props.activities}
            onCancel={this.props.onActivityCancel}/>
        </Sidebar>
      </Resizable>
    )
  }

  static propTypes = {
    activities: arrayOf(object).isRequired,
    edit: object.isRequired,
    expand: object.isRequired,
    hasLastImport: bool.isRequired,
    hold: object.isRequired,
    isDisabled: bool,
    isLastImportSelected: bool,
    isTrashSelected: bool,
    keymap: object.isRequired,
    list: number,
    lists: object.isRequired,
    listwalk: arrayOf(number).isRequired,
    project: shape({
      file: string,
      name: string,
      items: number
    }).isRequired,
    root: number.isRequired,
    tagColor: string,
    tags: arrayOf(object).isRequired,
    tagSelection: arrayOf(number).isRequired,
    width: number.isRequired,
    onActivityCancel: func.isRequired,
    onContextMenu: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onItemDelete: func.isRequired,
    onItemImport: func.isRequired,
    onItemTagAdd: func.isRequired,
    onListCollapse: func.isRequired,
    onListEdit: func.isRequired,
    onListExpand: func.isRequired,
    onListItemsAdd: func.isRequired,
    onListMove: func.isRequired,
    onListSave: func.isRequired,
    onProjectEdit: func.isRequired,
    onProjectSave: func.isRequired,
    onResize: func.isRequired,
    onSelect: func.isRequired,
    onTagCreate: func.isRequired,
    onTagDelete: func.isRequired,
    onTagSave: func.isRequired,
    onTagSelect: func.isRequired
  }

  static defaultProps = {
    activities: [],
    edit: {},
    keymap: {},
    root: LIST.ROOT,
    tags: []
  }

  static props = Object.keys(ProjectSidebar.propTypes)
}


const ProjectSidebarContainer = connect(
    (state, { root }) => ({
      activities: getActivities(state),
      expand: state.sidebar.expand,
      hasLastImport: state.imports.length > 0,
      hold: getListHold(state),
      isLastImportSelected: state.nav.imports,
      isTrashSelected: state.nav.trash,
      lists: state.lists,
      list: state.nav.list,
      listwalk: getListSubTree(state, { root: root || LIST.ROOT }),
      tags: getAllTags(state),
      tagColor: state.settings.tagColor,
      tagSelection: state.nav.tags,
      width: state.ui.sidebar.width
    }),

    (dispatch) => ({
      onActivityCancel(...args) {
        dispatch(act.activity.cancel(...args))
      },

      onListCollapse(...args) {
        dispatch(act.list.collapse(...args))
      },

      onListExpand(...args) {
        dispatch(act.list.expand(...args))
      },

      onListItemsAdd({ list, items }) {
        dispatch(act.list.items.add({
          id: list, items: items.map(item => item.id)
        }))
      },

      onListEdit(id) {
        dispatch(act.edit.start({ list: { id } }))
      },

      onListSave(...args) {
        dispatch(act.list.save(...args))
        dispatch(act.edit.cancel())
      },

      onListMove(...args) {
        dispatch(act.list.move(...args))
      },

      onProjectEdit() {
        dispatch(act.edit.start({ project: { name: true } }))
      },

      onProjectSave(...args) {
        dispatch(act.project.save(...args))
        dispatch(act.edit.cancel())
      },

      onResize(width) {
        dispatch(act.ui.update({
          sidebar: { width: Math.round(width) }
        }))
      },

      onTagDelete(tag) {
        dispatch(act.tag.delete(tag.id))
      },

      onTagSelect(...args) {
        dispatch(act.tag.select(...args))
      }
    })
  )(ProjectSidebar)

export {
  ProjectSidebarContainer as ProjectSidebar
}
