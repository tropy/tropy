'use strict'

const React = require('react')
const { ItemToolbar } = require('./toolbar')
const { ItemTabHeader, ItemTabBody } = require('./tab')
const { NoteList, NoteToolbar } = require('../note')
const { PanelGroup, Panel } = require('../panel')
const { PhotoGrid, PhotoList, PhotoToolbar } = require('../photo')
const { get, has, pick } = require('../../common/util')
const { keys } = Object
const cx = require('classnames')
const { PHOTO } = require('../../constants/sass')

const {
  array, bool, func, number, object, shape, string
} = require('prop-types')


class ItemPanel extends React.PureComponent {
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
    let PhotoIterator = panel.zoom ? PhotoGrid : PhotoList

    let hasMultipleItems = this.props.items.length > 1
    let item = hasMultipleItems ? null : this.props.items[0]

    return (
      <PanelGroup
        slots={panel.slots}
        onResize={this.handleResize}
        header={
          <ItemToolbar
            isItemOpen={this.props.isItemOpen}
            onMaximize={this.props.onMaximize}
            onModeChange={this.props.onModeChange}/>
        }>

        <Panel className="item-panel">
          <ItemTabHeader
            tab={panel.tab}
            onChange={this.handleTabChange}/>
          <ItemTabBody {...this.props}
            tab={panel.tab}/>
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
          <PhotoIterator
            {...pick(this.props, PhotoIterator.getPropKeys())}
            canCreate
            current={get(photo, ['id'])}
            isDisabled={isDisabled || !item || hasMultipleItems}
            selection={this.props.activeSelection}
            size={PHOTO.ZOOM[panel.zoom]}
            onChange={this.props.onMetadataSave}
            onContract={this.props.onPhotoContract}
            onCreate={this.handlePhotoCreate}
            onDelete={this.props.onPhotoDelete}
            onError={this.props.onPhotoError}
            onExpand={this.props.onPhotoExpand}
            onSelect={this.props.onPhotoSelect}
            onSelectionSort={this.props.onSelectionSort}
            onSort={this.props.onPhotoSort}
            onZoomChange={this.handleZoomChange}/>
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
    cache: string.isRequired,
    data: object.isRequired,
    edit: object.isRequired,
    expanded: array.isRequired,
    activeSelection: number,
    keymap: object.isRequired,
    isDisabled: bool.isRequired,
    isItemOpen: bool.isRequired,
    items: array.isRequired,

    note: object,
    notes: array.isRequired,
    selections: object.isRequired,

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
    onPhotoContract: func.isRequired,
    onPhotoCreate: func.isRequired,
    onPhotoDelete: func.isRequired,
    onPhotoError: func.isRequired,
    onPhotoExpand: func.isRequired,
    onPhotoSelect: func.isRequired,
    onPhotoSort: func.isRequired,
    onTagCreate: func.isRequired,
    onTagSave: func.isRequired,
    onSelectionSort: func.isRequired,
    onUiUpdate: func.isRequired
  }

  static props = keys(ItemPanel.propTypes)
}

module.exports = {
  ItemPanel
}
