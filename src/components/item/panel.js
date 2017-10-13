'use strict'

const React = require('react')
const { PureComponent } = React
const { ItemToolbar } = require('./toolbar')
const { ItemTabs, ItemTab } = require('./tabs')
const { NotePanel } = require('../note')
const { PanelGroup, Panel } = require('../panel')
const { PhotoPanel } = require('../photo')
const { get } = require('../../common/util')
const { keys } = Object

const {
  array, bool, func, number, object, shape, string
} = require('prop-types')


class ItemPanel extends PureComponent {

  get item() { // TODO remove
    const { items } = this.props
    return items.length === 1 ? items[0] : null
  }

  get isEmpty() {
    return this.props.items.length === 0
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
    const {
      edit,
      expanded,
      activeSelection,
      keymap,
      note,
      notes,
      panel,
      photo,
      selections,
      isDisabled,
      isItemOpen,
      onItemPreview,
      onMaximize,
      onModeChange,
      onNoteCreate,
      onNoteSelect,
      onPhotoContract,
      onPhotoDelete,
      onPhotoExpand,
      onPhotoSelect,
      onPhotoSort,
      onSelectionSort,
      ...props
    } = this.props

    const { item } = this
    const hasMultipleItems = this.props.items.length > 1

    return (
      <PanelGroup
        slots={panel.slots}
        onResize={this.handleResize}
        header={
          <ItemToolbar
            isItemOpen={isItemOpen}
            onMaximize={onMaximize}
            onModeChange={onModeChange}/>
        }>

        <Panel>
          <ItemTabs tab={panel.tab} onChange={this.handleTabChange}/>
          <ItemTab {...props}
            tab={panel.tab}
            isEmpty={this.isEmpty}
            isDisabled={isDisabled}
            isItemOpen={isItemOpen}/>
        </Panel>

        <PhotoPanel {...props}
          isDisabled={isDisabled || hasMultipleItems}
          isItemOpen={isItemOpen}
          edit={edit}
          expanded={expanded}
          keymap={keymap}
          zoom={panel.zoom}
          current={photo && photo.id}
          selection={activeSelection}
          selections={selections}
          onContract={onPhotoContract}
          onCreate={this.handlePhotoCreate}
          onDelete={onPhotoDelete}
          onExpand={onPhotoExpand}
          onItemPreview={onItemPreview}
          onSelect={onPhotoSelect}
          onSort={onPhotoSort}
          onSelectionSort={onSelectionSort}
          onZoomChange={this.handleZoomChange}/>

        <NotePanel {...props}
          isDisabled={isDisabled || !photo || hasMultipleItems}
          isItemOpen={isItemOpen}
          item={item && item.id}
          keymap={keymap.NoteList}
          photo={photo && photo.id}
          notes={notes}
          selection={note}
          onCreate={onNoteCreate}
          onSelect={onNoteSelect}/>
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
    onItemSave: func.isRequired,
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
