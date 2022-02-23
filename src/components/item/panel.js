import React from 'react'
import { Toolbar } from '../toolbar'
import { ItemToolbar } from './toolbar'
import { TabNav, TabPane } from '../tabs'
import { NoteList, NoteToolbar } from '../note'
import { PanelGroup, Panel } from '../panel'
import { PhotoPanel, PhotoToolbar } from '../photo'
import { MetadataPanel } from '../metadata'
import { TagPanel } from '../tag'
import { IconMetadata, IconHangtag } from '../icons'
import { has } from '../../common/util'
import { on, off, isInput } from '../../dom'
import cx from 'classnames'
import { TABS, UI } from '../../constants'

import {
  array, bool, func, number, object, shape, string
} from 'prop-types'


export class ItemPanelGroup extends React.PureComponent {
  panel = React.createRef()
  tab = React.createRef()

  componentDidMount() {
    on(document, 'global:next-tab', this.toggleTabs)
    on(document, 'global:prev-tab', this.toggleTabs)
  }

  componentWillUnmount() {
    off(document, 'global:next-tab', this.toggleTabs)
    off(document, 'global:prev-tab', this.toggleTabs)
  }

  get toolbar() {
    return (
      <ItemToolbar
        isItemOpen={this.props.isItemOpen}
        onModeChange={this.props.onModeChange}/>
    )
  }

  get keymap() {
    return this.props.keymap.ItemPanel
  }

  handleKeyDown = (event) => {
    if (isInput(event.target))
      return

    switch (this.keymap.match(event)) {
      case 'up':
        if (this.props.isReadOnly) return
        this.tab.current?.prev()
        break
      case 'down':
        if (this.props.isReadOnly) return
        this.tab.current?.next()
        break
      case 'left':
      case 'right':
        this.toggleTabs()
        this.panel.current?.focus()
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }

  handleEditCancel = () => {
    this.props.onEditCancel()
    this.panel.current.focus()
  }

  handleMetadataSave = (...args) => {
    this.props.onMetadataSave(...args)
    this.panel.current.focus()
  }

  handleTagAddCancel = () => {
    this.panel.current.focus()
  }

  handleNoteOpen = (note) => {
    if (note != null && !this.props.isItemOpen) {
      this.props.onItemOpen({
        id: this.props.items[0].id,
        photo: this.props.photo.id,
        note: note.id,
        selection: note.selection
      })
    }
  }

  handlePhotoCreate = (data) => {
    this.props.onPhotoCreate({
      item: this.props.items?.[0]?.id,
      ...data
    })
  }

  handleResize = (slots) => {
    this.props.onUiUpdate({ panel: { slots } })
  }

  handleTabChange = (tab) => {
    this.props.onUiUpdate({ panel: { tab } })
  }

  handleZoomChange = (zoom) => {
    this.props.onUiUpdate({ panel: { zoom } })
  }

  toggleTabs = () => {
    this.handleTabChange(
      this.props.panel.tab === UI.PANEL.METADATA ?
        UI.PANEL.TAGS :
        UI.PANEL.METADATA
    )
  }

  render() {
    let { isDisabled, isReadOnly, photo, panel } = this.props
    let hasMultipleItems = this.props.items.length > 1
    let item = hasMultipleItems ? null : this.props.items[0]

    let isPhotosDisabled =
      isDisabled || isReadOnly || item == null || hasMultipleItems
    let isNotesDisabled = isPhotosDisabled || isReadOnly || photo == null

    return (
      <PanelGroup
        className="item-panel-group"
        header={this.toolbar}
        slots={panel.slots}
        onResize={this.handleResize}>

        <Panel
          className="item-panel"
          ref={this.panel}
          tabIndex={TABS.ItemPanel}
          onKeyDown={this.handleKeyDown}>
          <Toolbar>
            <Toolbar.Left>
              <TabNav
                active={panel.tab}
                justified
                tabs={this.props.tabs}
                onChange={this.handleTabChange}/>
            </Toolbar.Left>
          </Toolbar>
          <TabPane active={panel.tab}>
            {(tab, props) => {
              if (this.props.items.length === 0) return null

              switch (tab) {
                case UI.PANEL.METADATA:
                  return (
                    <MetadataPanel
                      {...props}
                      ref={this.tab}
                      isDisabled={isDisabled || isReadOnly}
                      onContextMenu={this.props.onContextMenu}
                      onEdit={this.props.onEdit}
                      onEditCancel={this.handleEditCancel}
                      onMetadataSave={this.handleMetadataSave}
                      onOpenInFolder={this.props.onOpenInFolder}
                      onPhotoSave={this.props.onPhotoSave}/>
                  )
                case UI.PANEL.TAGS:
                  return (
                    <TagPanel
                      {...props}
                      ref={this.tab}
                      isDisabled={isDisabled || isReadOnly}
                      onCancel={this.handleTagAddCancel}
                      onContextMenu={this.props.onContextMenu}
                      onItemTagAdd={this.props.onItemTagAdd}
                      onItemTagRemove={this.props.onItemTagRemove}
                      onTagCreate={this.props.onTagCreate}/>
                  )
              }
            }}
          </TabPane>
        </Panel>

        <Panel className={cx('photo-panel', {
          'has-active': has(photo, ['id'])
        })}>
          <PhotoToolbar
            hasCreateButton
            isDisabled={isPhotosDisabled}
            photos={this.props.photos.length}
            zoom={panel.zoom}
            onCreate={this.handlePhotoCreate}
            onZoomChange={this.handleZoomChange}/>
          <PhotoPanel
            canCreate
            isDisabled={isPhotosDisabled}
            isItemOpen={this.props.isItemOpen}
            photos={this.props.photos}
            zoom={panel.zoom}
            onEdit={this.props.onEdit}
            onEditCancel={this.props.onEditCancel}
            onItemOpen={this.props.onItemOpen}
            onChange={this.props.onMetadataSave}
            onConsolidate={this.props.onPhotoConsolidate}
            onContextMenu={this.props.onContextMenu}
            onCreate={this.handlePhotoCreate}
            onError={this.props.onPhotoError}
            onItemPreview={this.props.onItemPreview}
            onRotate={this.props.onPhotoRotate}
            onSelect={this.props.onPhotoSelect}/>
        </Panel>

        <Panel className={cx('note-panel', {
          'has-active': has(this.props.note, ['id'])
        })}>
          <NoteToolbar
            hasCreateButton
            isDisabled={isNotesDisabled}
            notes={this.props.notes.length}
            onCreate={this.props.onNoteCreate}/>
          <NoteList
            isDisabled={isNotesDisabled}
            keymap={this.props.keymap.NoteList}
            notes={this.props.notes}
            selection={this.props.note}
            onDelete={this.props.onNoteDelete}
            onContextMenu={this.props.onContextMenu}
            onOpen={this.handleNoteOpen}
            onSelect={this.props.onNoteSelect}/>
        </Panel>
      </PanelGroup>
    )
  }

  static propTypes = {
    isDisabled: bool,
    isReadOnly: bool,
    isItemOpen: bool.isRequired,
    items: array.isRequired,
    keymap: object.isRequired,
    note: object,
    notes: array.isRequired,
    panel: shape({
      slots: array.isRequired,
      tab: string.isRequired,
      zoom: number.isRequired
    }).isRequired,
    photo: shape({
      id: number.isRequired
    }),
    photos: array.isRequired,
    tabs: array,
    onContextMenu: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func,
    onItemOpen: func.isRequired,
    onItemPreview: func.isRequired,
    onItemTagAdd: func.isRequired,
    onItemTagRemove: func.isRequired,
    onMetadataSave: func.isRequired,
    onModeChange: func.isRequired,
    onNoteCreate: func.isRequired,
    onNoteDelete: func.isRequired,
    onNoteSelect: func.isRequired,
    onOpenInFolder: func.isRequired,
    onPhotoConsolidate: func.isRequired,
    onPhotoCreate: func.isRequired,
    onPhotoError: func.isRequired,
    onPhotoRotate: func.isRequired,
    onPhotoSave: func.isRequired,
    onPhotoSelect: func.isRequired,
    onTagCreate: func.isRequired,
    onTagSave: func.isRequired,
    onUiUpdate: func.isRequired
  }

  static defaultProps = {
    tabs: [
      {
        name: UI.PANEL.METADATA,
        label: 'panel.metadata.tab',
        icon: <IconMetadata/>
      },
      {
        name: UI.PANEL.TAGS,
        label: 'panel.tags.tab',
        icon: <IconHangtag/>
      }
    ]
  }

  static props = Object.keys(ItemPanelGroup.propTypes)
}
