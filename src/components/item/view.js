'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { FormattedMessage } = require('react-intl')
const { Toolbar, ToolGroup } = require('../toolbar')
const { Tab, Tabs } = require('../tabs')
const { NotePanel, NotePad } = require('../note')
const { PanelGroup, Panel } = require('../panel')
const { Resizable } = require('../resizable')
const { PhotoPanel } = require('../photo')
const { IconMetadata, IconTag, IconChevron16 } = require('../icons')
const { IconButton } = require('../button')
const { Image } = require('../image')
const { Fields, TemplateSelect } = require('../metadata')
const { MODE } = require('../../constants/project')

const {
  func, arrayOf, shape, number, bool, object, oneOf, string
} = PropTypes


class ItemView extends PureComponent {

  get item() {
    const { items } = this.props
    return items.length === 1 ? items[0] : null
  }

  get photo() {
    const { photo, photos } = this.props
    return photo ? photos.find(({ id }) => id === photo) : null
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
    if (this.props.panel.tab !== 'metadata') {
      this.props.onPanelTabSelect('metadata')
    }
  }

  handleTagsTabSelect = () => {
    if (this.props.panel.tab !== 'tags') {
      this.props.onPanelTabSelect('tags')
    }
  }


  handlePhotoCreate = (options) => {
    const { onPhotoCreate } = this.props
    const { item } = this

    onPhotoCreate({ ...options, item: item.id })
  }


  handleTemplateChange = (event) => {
    this.props.onItemSave({
      id: this.item.id,
      property: 'template',
      value: event.target.value
    })
  }


  renderItemTabs() {
    const { panel } = this.props

    return (
      <Tabs justified>
        <Tab
          isActive={panel.tab === 'metadata'}
          onActivate={this.handleMetadataTabSelect}>
          <IconMetadata/>
          <FormattedMessage id="panel.metadata.tab"/>
        </Tab>
        <Tab
          isActive={panel.tab === 'tags'}
          onActivate={this.handleTagsTabSelect}>
          <IconTag/>
          <FormattedMessage id="panel.tags"/>
        </Tab>
      </Tabs>
    )
  }

  renderItemPanel() {
    const { panel } = this.props

    switch (this.props.items.length) {
      case 0:
        return  null

      case 1:
        switch (panel.tab) {
          case 'metadata':
            return this.renderMetadataPanel()
          case 'tags':
            return this.renderTagsPanel()
          default:
            return null
        }

      default:
        // bulk editor
    }
  }

  renderMetadataPanel() {
    const { data, templates, ...props } = this.props
    const { item, photo, isDisabled } = this

    return (
      <div className="metadata-container">
        {photo &&
          <section>
            <h5 className="metadata-heading separator">
              <FormattedMessage id="panel.metadata.photo"/>
            </h5>
            <Fields {...props}
              subject={photo}
              data={data[photo.id]}
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
              data={data[item.id]}
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

  renderToolbar() {
    return (
      <Toolbar onDoubleClick={ARGS.frameless ? this.props.onMaximize : null}>
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
    const {
      note,
      panel,
      photo,
      onPhotoSelect,
      onPhotoSort,
      onPhotoZoomChange,
      onNoteCreate,
      onNoteSave,
      onNoteSelect,
      ...props
    } = this.props

    const { item } = this

    return (
      <section id="item-view">
        <Resizable edge={'left'} value={320}>
          <PanelGroup
            header={this.renderToolbar()}
            height={[33.33, 33.33, 33.33]}>

            <Panel>
              {this.renderItemTabs()}
              {this.renderItemPanel()}
            </Panel>

            <PhotoPanel {...props}
              zoom={panel.photoZoom}
              selected={photo}
              onZoomChange={onPhotoZoomChange}
              isItemOpen={this.isItemMode}
              isDisabled={this.isDisabled}
              onSelect={onPhotoSelect}
              onSort={onPhotoSort}
              onCreate={this.handlePhotoCreate}/>

            <NotePanel {...props}
              item={item && item.id}
              photo={photo}
              selected={note}
              isItemOpen={this.isItemMode}
              isDisabled={this.isDisabled}
              onCreate={onNoteCreate}
              onSave={onNoteSave}
              onSelect={onNoteSelect}/>
          </PanelGroup>
        </Resizable>

        <div className="item-container">
          <Image isVisible photo={this.photo}/>
          <NotePad/>
        </div>
      </section>
    )
  }


  static propTypes = {
    items: arrayOf(
      shape({
        id: number.isRequired,
        tags: arrayOf(number),
        deleted: bool
      })
    ),

    data: object.isRequired,

    notes: arrayOf(
      shape({
        id: number.isRequired
      })
    ),

    photos: arrayOf(
      shape({
        id: number.isRequired,
        deleted: bool
      })
    ),

    note: number,
    photo: number,

    panel: shape({
      tab: oneOf(['metadata', 'tags']).isRequired,
      photoZoom: number.isRequired
    }).isRequired,

    mode: string.isRequired,
    properties: object.isRequired,
    templates: object.isRequired,

    onItemSave: func.isRequired,
    onContextMenu: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onMaximize: func.isRequired,
    onMetadataSave: func.isRequired,
    onModeChange: func.isRequired,
    onNoteCreate: func.isRequired,
    onNoteSave: func.isRequired,
    onNoteSelect: func.isRequired,
    onPanelTabSelect: func.isRequired,
    onPhotoCreate: func.isRequired,
    onPhotoSelect: func.isRequired,
    onPhotoSort: func.isRequired,
    onPhotoZoomChange: func.isRequired
  }
}

module.exports = {
  ItemView
}
