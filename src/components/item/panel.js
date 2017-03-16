'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { array, bool, func, number, object, shape, string } = PropTypes
const { ItemToolbar } = require('./toolbar')
const { ItemTabs, ItemTab } = require('./tabs')
const { NotePanel } = require('../note')
const { PanelGroup, Panel } = require('../panel')
const { PhotoPanel } = require('../photo')
const { get } = require('../../common/util')
const { keys } = Object


class ItemPanel extends PureComponent {

  get item() { // TODO remove
    const { items } = this.props
    return items.length === 1 ? items[0] : null
  }

  handlePhotoCreate = (options) => {
    this.props.onPhotoCreate({
      ...options,
      item: get(this.props.items, [0, 'id']) })
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
      context,
      edit,
      note,
      notes,
      panel,
      photo,
      isItemOpen,
      onMaximize,
      onModeChange,
      onNoteCreate,
      onNoteSelect,
      onPhotoSelect,
      onPhotoSort,
      ...props
    } = this.props

    const { item } = this

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
            isItemOpen={isItemOpen}
            photo={photo}
            tab={panel.tab}
            edit={edit.field}/>
        </Panel>

        <PhotoPanel {...props}
          isItemOpen={isItemOpen}
          context={context.photo}
          edit={edit.photo}
          zoom={panel.zoom}
          selection={photo && photo.id}
          onCreate={this.handlePhotoCreate}
          onSelect={onPhotoSelect}
          onSort={onPhotoSort}
          onZoomChange={this.handleZoomChange}/>

        <NotePanel {...props}
          isItemOpen={isItemOpen}
          item={item && item.id}
          photo={photo && photo.id}
          notes={notes}
          selection={note && note.id}
          onCreate={onNoteCreate}
          onSelect={onNoteSelect}/>
      </PanelGroup>
    )
  }

  static propTypes = {
    cache: string.isRequired,
    context: object.isRequired,
    data: object.isRequired,
    edit: object.isRequired,
    isItemOpen: bool.isRequired,
    items: array.isRequired,

    note: shape({
      id: number.isRequired
    }),
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
    templates: object.isRequired,


    onContextMenu: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: PropTypes.func,
    onItemOpen: func.isRequired,
    onItemSave: func.isRequired,
    onMaximize: func.isRequired,
    onMetadataSave: func.isRequired,
    onModeChange: func.isRequired,
    onNoteCreate: func.isRequired,
    onNoteSelect: func.isRequired,
    onPhotoCreate: func.isRequired,
    onPhotoSelect: func.isRequired,
    onPhotoSort: func.isRequired,
    onUiUpdate: func.isRequired
  }

  static props = keys(ItemPanel.propTypes)
}

module.exports = {
  ItemPanel
}
