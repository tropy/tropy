'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { connect } = require('react-redux')
const { FormattedMessage } = require('react-intl')
const { Toolbar, ToolGroup } = require('../toolbar')
const { Tab, Tabs } = require('../tabs')
const { Note, NoteToolbar, NoteList } = require('../note')
const { PanelGroup, Panel } = require('../panel')
const { Resizable } = require('../resizable')
const { PhotoToolbar, PhotoList, PhotoGrid } = require('../photo')
const { IconMetadata, IconTag, IconChevron16 } = require('../icons')
const { IconButton } = require('../button')
const { Image } = require('../image')
const { Fields, TemplateSelect } = require('../metadata')
const { getSelectedItems } = require('../../selectors/items')
const { getPhotos, getSelectedPhoto } = require('../../selectors/photos')
const { MODE } = require('../../constants/project')
const act = require('../../actions')


class Item extends Component {

  get item() {
    const { items } = this.props
    return items.length === 1 ? items[0] : null
  }

  get isDisabled() {
    const { item } = this
    return !(item && !item.deleted)
  }

  get isItemMode() {
    return this.props.mode === MODE.ITEM
  }


  handleModeChange = () => {
    this.props.onModeChange(MODE.PROJECT)
  }

  handleMetadataTabSelect = () => {
    if (this.props.nav.panel.tab !== 'metadata') {
      this.props.onTabSelect('metadata')
    }
  }

  handleTagsTabSelect = () => {
    if (this.props.nav.panel.tab !== 'tags') {
      this.props.onTabSelect('tags')
    }
  }

  handlePhotoEdit = (photo) => {
    this.props.onEdit({ photo })
  }

  handlePhotoChange = ({ id, title }, value) => {
    this.props.onMetadataSave({
      id,
      data: {
        [title]: { value, type: 'text' }
      }
    })
  }

  handlePhotoCreate = (event) => {
    const { onPhotoCreate } = this.props
    const { item } = this

    event.stopPropagation()
    onPhotoCreate({ item: item.id })
  }

  handleNoteCreate = (event) => {
    event.stopPropagation()
  }

  handleTemplateChange = (event) => {
    this.props.onSave({
      id: this.item.id,
      property: 'template',
      value: event.target.value
    })
  }


  renderItemTabs() {
    const { nav, selection } = this.props

    return (
      <Tabs justified>
        <Tab
          active={nav.panel.tab === 'metadata'}
          disabled={!selection.length}
          onActivate={this.handleMetadataTabSelect}>
          <IconMetadata/>
          <FormattedMessage id="panel.metadata.tab"/>
        </Tab>
        <Tab
          active={nav.panel.tab === 'tags'}
          disabled={!selection.length}
          onActivate={this.handleTagsTabSelect}>
          <IconTag/>
          <FormattedMessage id="panel.tags"/>
        </Tab>
      </Tabs>
    )
  }

  renderItemPanel() {
    const { selection, nav } = this.props

    switch (selection.length) {
      case 0:
        return <span>No items selected</span>

      case 1:
        switch (nav.panel.tab) {
          case 'metadata':
            return this.renderMetadataPanel()
          case 'tags':
            return this.renderTagsPanel()
          default:
            return null
        }

      default:
        return <span>{selection.length} items selected</span>
    }
  }

  renderMetadataPanel() {
    const { photo, templates, ...props } = this.props
    const { item, isDisabled } = this

    return (
      <div>
        {photo &&
          <section>
            <h5 className="metadata-heading">
              <FormattedMessage id="panel.metadata.photo"/>
            </h5>
            <Fields {...props}
              subject={photo}
              isDisabled={isDisabled}
              template={templates[photo.template]}/>
          </section>}
        {item &&
          <section>
            <h5 className="metadata-heading">
              <FormattedMessage id="panel.metadata.item"/>
            </h5>
            <TemplateSelect
              templates={templates}
              selected={item.template}
              onChange={this.handleTemplateChange}/>
            <Fields {...props}
              subject={item}
              isDisabled={isDisabled}
              template={templates[item.template]}/>
          </section>}
      </div>
    )
  }

  renderTagsPanel() {
    const { item } = this
    if (!item || !item.tags) return

    return (
      <ul>
        {item.tags.map(tag => <li key={tag}>{tag}</li>)}
      </ul>
    )
  }

  renderPhotoToolbar() {
    const { nav, onPhotoZoomChange } = this.props

    return (
      <PhotoToolbar
        zoom={nav.panel.photoZoom}
        onZoomChange={onPhotoZoomChange}
        hasCreateButton={!this.isDisabled}
        onCreate={this.handlePhotoCreate}/>
    )
  }

  renderPhotoPanel() {
    const {
      photo,
      photos,
      nav,
      onPhotoSelect,
      onPhotoSort,
      ...props
    } = this.props

    if (nav.panel.photoZoom) {
      return (
        <PhotoGrid {...props}
          photos={photos}
          selected={photo && photo.id}
          isDisabled={this.isDisabled}/>
      )
    }

    return (
      <PhotoList {...props}
        photos={photos}
        selected={photo && photo.id}
        isOpen={this.isItemMode}
        onSelect={onPhotoSelect}
        onSort={onPhotoSort}
        onChange={this.handlePhotoChange}
        onEdit={this.handlePhotoEdit}
        isDisabled={this.isDisabled}/>
    )
  }

  renderNoteToolbar() {
    return (
      <NoteToolbar
        hasCreateButton={false}
        onCreate={this.handleNoteCreate}/>
    )
  }

  renderNotePanel() {
    const { note } = this.props
    const { item } = this

    return item && (
      <NoteList
        notes={item.notes || []}
        selected={note}
        isDisabled={this.isDisabled}/>
    )
  }

  renderToolbar() {
    return (
      <Toolbar {...this.props} draggable={ARGS.frameless}>
        <div className="toolbar-left">
          <ToolGroup>
            <IconButton
              icon={<IconChevron16/>}
              onClick={this.handleModeChange}/>
          </ToolGroup>
        </div>
      </Toolbar>
    )
  }

  render() {
    const { photo } = this.props

    return (
      <section id="item">
        <Resizable edge={'left'} value={320}>
          <PanelGroup header={this.renderToolbar()} height={[50, 30, 20]}>
            <Panel header={this.renderItemTabs()}>
              {this.renderItemPanel()}
            </Panel>

            <Panel header={this.renderPhotoToolbar()}>
              {this.renderPhotoPanel()}
            </Panel>

            <Panel header={this.renderNoteToolbar()}>
              {this.renderNotePanel()}
            </Panel>
          </PanelGroup>
        </Resizable>

        <div className="item-container">
          <Image isVisible photo={photo}/>
          <Note/>
        </div>
      </section>
    )
  }

  static propTypes = {
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        tags: PropTypes.arrayOf(PropTypes.number),
        deleted: PropTypes.bool
      })
    ),

    photos: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        deleted: PropTypes.bool
      })
    ),

    photo: PropTypes.shape({
      id: PropTypes.number.isRequired
    }),

    nav: PropTypes.shape({
      panel: PropTypes.shape({
        tab: PropTypes.oneOf(['metadata', 'tags']).isRequired,
        photoZoom: PropTypes.number.isRequired
      }).isRequired,
    }).isRequired,

    mode: PropTypes.string,
    note: PropTypes.number,
    selection: PropTypes.arrayOf(PropTypes.number),
    properties: PropTypes.object,
    templates: PropTypes.object,

    onOpen: PropTypes.func,
    onSave: PropTypes.func,
    onContextMenu: PropTypes.func,
    onEdit: PropTypes.func,
    onEditCancel: PropTypes.func,
    onMaximize: PropTypes.func,
    onMetadataSave: PropTypes.func,
    onModeChange: PropTypes.func,
    onTabSelect: PropTypes.func,
    onPhotoCreate: PropTypes.func,
    onPhotoSelect: PropTypes.func,
    onPhotoSort: PropTypes.func,
    onPhotoZoomChange: PropTypes.func
  }
}


module.exports = {
  Item: connect(
    (state) => ({
      items: getSelectedItems(state),
      photo: getSelectedPhoto(state),
      photos: getPhotos(state),
      note: state.nav.note,
      selection: state.nav.items
    }),

    (dispatch) => ({
      onTabSelect(tab) {
        dispatch(act.nav.panel.update({ tab }))
      },

      onPhotoCreate(...args) {
        dispatch(act.photo.create(...args))
      },

      onPhotoSelect(...args) {
        dispatch(act.photo.select(...args))
      },

      onPhotoZoomChange(photoZoom) {
        dispatch(act.nav.panel.update({ photoZoom }))
      }
    })
  )(Item)
}
