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
const { on, off } = require('../../dom')
const { keys } = Object
const cx = require('classnames')

const { PANEL } = require('../../constants/ui')
const { TABS } = require('../../constants')

const {
  array, bool, func, number, object, shape, string
} = require('prop-types')


class ItemPanelGroup extends React.PureComponent {
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
        onMaximize={this.props.onMaximize}
        onModeChange={this.props.onModeChange}/>
    )
  }

  get keymap() {
    return this.props.keymap.ItemPanel
  }

  handleKeyDown = (event) => {
    switch (this.keymap.match(event)) {
      case 'up':
        if (this.tab.current) {
          this.tab.current.prev()
        }
        break
      case 'down':
        if (this.tab.current) {
          this.tab.current.next()
        }
        break
      case 'left':
      case 'right':
        this.toggleTabs()
        this.panel.current.focus()
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

  handleTagAddCancel = (hasChanged) => {
    if (!hasChanged) {
      this.panel.current.focus()
    }
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

  toggleTabs = () => {
    this.handleTabChange(
      this.props.panel.tab === PANEL.METADATA ? PANEL.TAGS : PANEL.METADATA
    )
  }

  render() {
    let { isDisabled, photo, panel } = this.props
    let hasMultipleItems = this.props.items.length > 1
    let item = hasMultipleItems ? null : this.props.items[0]
    let canCreatePhoto = !(isDisabled || item == null || hasMultipleItems)

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
                      ref={this.tab}
                      isDisabled={isDisabled}
                      onContextMenu={this.props.onContextMenu}
                      onEdit={this.props.onEdit}
                      onEditCancel={this.handleEditCancel}
                      onMetadataSave={this.handleMetadataSave}
                      onOpenInFolder={this.props.onOpenInFolder}/>
                  )
                case PANEL.TAGS:
                  return (
                    <TagPanel
                      {...props}
                      ref={this.tab}
                      isDisabled={isDisabled}
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
            canCreate={canCreatePhoto}
            hasCreateButton
            isDisabled={isDisabled || item == null}
            photos={this.props.photos.length}
            zoom={panel.zoom}
            onCreate={this.handlePhotoCreate}
            onZoomChange={this.handleZoomChange}/>
          <PhotoPanel
            canCreate
            isDisabled={!canCreatePhoto}
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
            isDisabled={!canCreatePhoto || photo == null}
            notes={this.props.notes.length}
            onCreate={this.props.onNoteCreate}/>
          <NoteList
            isDisabled={!canCreatePhoto || photo == null}
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
    isDisabled: bool.isRequired,
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
