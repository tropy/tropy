import React from 'react'
import { connect } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { Titlebar } from '../toolbar.js'
import { ActivityPane } from '../activity.js'
import { Resizable } from '../resizable.js'
import { ListLeafNode, ListTree, TrashListNode } from '../list/index.js'
import { TagList } from '../tag/index.js'
import { Sidebar, SidebarBody } from '../sidebar.js'
import { ProjectName } from './name.js'
import { TABS, LIST, SASS } from '../../constants/index.js'
import { has } from '../../common/util.js'
import { match } from '../../keymap.js'
import { testFocusChange } from '../../dom.js'
import * as act from '../../actions/index.js'

import {
  getActivities,
  getAllTags,
  getListSubTree
} from '../../selectors/index.js'


class ProjectSidebar extends React.PureComponent {
  get isEditing() {
    return has(this.props.edit, 'project')
  }

  get hasActiveTags() {
    return this.props.tagSelection.length > 0
  }

  get hasSelection() {
    return this.props.list != null ||
      this.props.isTrashSelected || (
      this.props.isLastImportSelected && this.props.hasLastImport
    )
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
    return list > 0 && list === this.props.list
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
      case (this.props.list === -1):
        return this.props.hasLastImport ?
            this.handleLastImportSelect() :
            this.handleTrashSelect()
      case this.isListEmpty():
      case this.isListSelected(this.getLastList()):
        return this.handleUnlistedSelect()
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
      case this.props.isTrashSelected:
        return this.props.hasLastImport ?
            this.handleLastImportSelect() :
            this.handleUnlistedSelect()
      case this.props.isLastImportSelected:
        return this.handleUnlistedSelect(this.getLastList())
      case (this.props.list === -1):
        return this.handleListSelect(this.getLastList())
      case this.isListEmpty():
      case this.isListSelected(this.getFirstList()):
        return this.handleSelect()
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

  handleUnlistedSelect = () => {
    this.props.onSelect({ list: -1 }, { throttle: true })
  }

  handleTrashDropItems = (items) => {
    this.props.onItemDelete(items.map(it => it.id))
  }

  handleListClick = (id) => {
    if (!this.handleListSelect(id)) {
      if (!this.hasFocusChanged()) {
        this.props.onEdit({ list: { id } })
      }
    }
  }

  handleListSelect = (list) => {
    if (list > 0 && (!this.isListSelected(list) || this.hasActiveTags)) {
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
                {root && (
                  <ListTree
                    parent={root}
                    lists={this.props.lists}
                    edit={this.props.edit.list}
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
                    onSave={this.props.onListSave}/>
                )}
                <ol>
                  {root && (
                    <ListLeafNode
                      name="sidebar.unlisted"
                      icon="UnlistedItems"
                      isSelected={this.props.list === -1}
                      onClick={this.handleUnlistedSelect}/>
                  )}
                  {this.props.hasLastImport && (
                    <ListLeafNode
                      name="sidebar.imports"
                      icon="Clock"
                      isSelected={this.props.isLastImportSelected}
                      onClick={this.handleLastImportSelect}/>
                  )}
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

  static defaultProps = {
    activities: [],
    edit: {},
    keymap: {},
    root: LIST.ROOT,
    tags: []
  }
}


const ProjectSidebarContainer = connect(
  (state, { root }) => ({
    activities: getActivities(state),
    edit: state.edit,
    hasLastImport: state.imports.length > 0,
    isLastImportSelected: state.nav.imports,
    isTrashSelected: state.nav.trash,
    keymap: state.keymap,
    list: state.nav.list,
    lists: state.lists,
    listwalk: getListSubTree(state, { root: root || LIST.ROOT }),
    tagColor: state.settings.tagColor,
    tagSelection: state.nav.tags,
    tags: getAllTags(state),
    width: state.ui.sidebar.width
  }),

  (dispatch) => ({
    onActivityCancel(...args) {
      dispatch(act.activity.cancel(...args))
    },

    onEdit(...args) {
      dispatch(act.edit.start(...args))
    },

    onEditCancel() {
      dispatch(act.edit.cancel())
    },

    onItemTagAdd(...args) {
      dispatch(act.item.tags.create(...args))
    },

    onListCollapse(...args) {
      dispatch(act.list.collapse(...args))
    },

    onListEdit(id) {
      dispatch(act.edit.start({ list: { id } }))
    },

    onListExpand(...args) {
      dispatch(act.list.expand(...args))
    },

    onListItemsAdd({ list, items }) {
      dispatch(act.list.items.add({
        id: list, items: items.map(item => item.id)
      }))
    },

    onListMove(...args) {
      dispatch(act.list.move(...args))
    },

    onListSave(...args) {
      dispatch(act.list.save(...args))
      dispatch(act.edit.cancel())
    },

    onProjectEdit() {
      dispatch(act.edit.start({ project: { name: true } }))
    },

    onProjectSave(...args) {
      dispatch(act.project.save(...args))
    },

    onResize(width) {
      dispatch(act.ui.update({
        sidebar: { width: Math.round(width) }
      }))
    },

    onSelect(...args) {
      dispatch(act.nav.select(...args))
    },

    onTagCreate(data) {
      dispatch(act.tag.create(data))
    },

    onTagDelete(tag) {
      dispatch(act.tag.delete(tag.id))
    },

    onTagSave(data, id) {
      dispatch(act.tag.save({ ...data, id }))
    },

    onTagSelect(...args) {
      dispatch(act.tag.select(...args))
    }
  })
)(ProjectSidebar)

export {
  ProjectSidebarContainer as ProjectSidebar
}
