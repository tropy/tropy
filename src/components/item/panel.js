'use strict'

const React = require('react')
const { ItemToolbar } = require('./toolbar')
const { TabNav, TabPane } = require('../tabs')
const { NoteList, NoteToolbar } = require('../note')
const { PanelGroup, Panel } = require('../panel')
const { PhotoPanel, PhotoToolbar } = require('../photo')
const { MetadataPanel } = require('../metadata')
const { TagPanel } = require('../tag')
const { IconMetadata, IconHangtag } = require('../icons')
const { get, has } = require('../../common/util')
const { keys } = Object
const cx = require('classnames')

const { PANEL } = require('../../constants/ui')

const {
  array, bool, func, number, object, shape, string
} = require('prop-types')


class ItemPanelGroup extends React.PureComponent {
  get toolbar() {
    return (
      <ItemToolbar
        isItemOpen={this.props.isItemOpen}
        onMaximize={this.props.onMaximize}
        onModeChange={this.props.onModeChange}/>
    )
  }

  handleNoteOpen = (note) => {
    if (note != null && !this.props.isItemOpen) {
      this.props.onItemOpen({
        id: this.props.items[0].id,
        photos: [this.props.photo.id],
        notes: [note.id],
        selection: note.selection
      })
    }
  }

  handlePhotoCreate = (dropped) => {
    this.props.onPhotoCreate({
      item: get(this.props.items, [0, 'id']),
      files: dropped && dropped.files
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

  render() {
    let { isDisabled, photo, panel } = this.props

    let hasMultipleItems = this.props.items.length > 1
    let item = hasMultipleItems ? null : this.props.items[0]

    return (
      <PanelGroup
        className="item-panel-group"
        header={this.toolbar}
        slots={panel.slots}
        onResize={this.handleResize}>

        <Panel className="item-panel">
          <TabNav
            active={panel.tab}
            justified
            tabs={this.props.tabs}
            onChange={this.handleTabChange}/>
          <TabPane active={panel.tab}>
            {(tab, props) => {
              if (this.props.items.length === 0) return null

              switch (tab) {
                case PANEL.METADATA:
                  return (
                    <MetadataPanel
                      {...props}
                      isDisabled={isDisabled}
                      onContextMenu={this.props.onContextMenu}
                      onEdit={this.props.onEdit}
                      onEditCancel={this.props.onEditCancel}
                      onMetadataSave={this.props.onMetadataSave}
                      onOpenInFolder={this.props.onOpenInFolder}/>
                  )
                case PANEL.TAGS:
                  return (
                    <TagPanel
                      {...props}
                      isDisabled={isDisabled}
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
            canCreate={isDisabled || !item || hasMultipleItems}
            hasCreateButton
            isDisabled={isDisabled || !item}
            photos={this.props.photos.length}
            zoom={panel.zoom}
            onCreate={this.handlePhotoCreate}
            onZoomChange={this.handleZoomChange}/>
          <PhotoPanel
            canCreate
            isDisabled={isDisabled || !item || hasMultipleItems}
            isItemOpen={this.props.isItemOpen}
            photos={this.props.photos}
            zoom={panel.zoom}
            onEdit={this.props.onEdit}
            onEditCancel={this.props.onEditCancel}
            onItemOpen={this.props.onItemOpen}
            onChange={this.props.onMetadataSave}
            onContextMenu={this.props.onContextMenu}
            onCreate={this.handlePhotoCreate}
            onError={this.props.onPhotoError}
            onItemPreview={this.props.onItemPreview}
            onSelect={this.props.onPhotoSelect}/>
        </Panel>

        <Panel className={cx('note-panel', {
          'has-active': has(this.props.note, ['id'])
        })}>
          <NoteToolbar
            hasCreateButton
            isDisabled={isDisabled || !photo || !item || hasMultipleItems}
            notes={this.props.notes.length}
            onCreate={this.props.onNoteCreate}/>
          <NoteList
            isDisabled={isDisabled || !photo || !item || hasMultipleItems}
            keymap={this.props.keymap.NoteList}
            notes={this.props.notes}
            selection={this.props.note}
            onContextMenu={this.props.onContextMenu}
            onOpen={this.handleNoteOpen}
            onSelect={this.props.onNoteSelect}/>
        </Panel>
      </PanelGroup>
    )
  }

  static propTypes = {
    tabs: array,
    keymap: object.isRequired,
    isDisabled: bool.isRequired,
    isItemOpen: bool.isRequired,
    items: array.isRequired,

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
    properties: object.isRequired,

    onContextMenu: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func,
    onItemOpen: func.isRequired,
    onItemPreview: func.isRequired,
    onItemTagAdd: func.isRequired,
    onItemTagRemove: func.isRequired,
    onMaximize: func.isRequired,
    onMetadataSave: func.isRequired,
    onModeChange: func.isRequired,
    onNoteCreate: func.isRequired,
    onNoteSelect: func.isRequired,
    onOpenInFolder: func.isRequired,
    onPhotoCreate: func.isRequired,
    onPhotoError: func.isRequired,
    onPhotoSelect: func.isRequired,
    onTagCreate: func.isRequired,
    onTagSave: func.isRequired,
    onUiUpdate: func.isRequired
  }

  static defaultProps = {
    tabs: [
      {
        name: PANEL.METADATA,
        label: 'panel.metadata.tab',
        icon: <IconMetadata/>
      },
      {
        name: PANEL.TAGS,
        label: 'panel.tags.tab',
        icon: <IconHangtag/>
      }
    ]
  }

  static props = keys(ItemPanelGroup.propTypes)
}

module.exports = {
  ItemPanelGroup
}
