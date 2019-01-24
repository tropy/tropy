'use strict'

const React = require('react')
const { connect } = require('react-redux')
const { MetadataList } = require('./list')
const { MetadataSection } = require('./section')
const { TemplateSelect } = require('../template/select')
const { PopupSelect } = require('../resource/popup')
const { PhotoInfo } = require('../photo/info')
const { ItemInfo } = require('../item/info')
const { SelectionInfo } = require('../selection/info')
const { TABS } = require('../../constants')
const { match } = require('../../keymap')
const { on, off } = require('../../dom')
const { get } = require('../../common/util')
const actions = require('../../actions')

const { shapes } = require('../util')
const { arrayOf, bool, func, object, shape } = require('prop-types')

const {
  getActiveSelection,
  getItemFields,
  getItemTemplates,
  getPhotoFields,
  getPropertyList,
  getSelectedItemTemplate,
  getSelectedItems,
  getSelectionFields,
  getSelectedPhoto
} = require('../../selectors')


class MetadataPanel extends React.PureComponent {
  constructor(props) {
    super(props)
    this.fields = [null, null, null]
    this.state = {
      fieldPopup: null
    }
  }

  componentDidMount() {
    on(this.container, 'tab:focus', this.handleTabFocus)
    on(document, 'ctx:add-extra-field', this.showFieldPopup)
  }

  componentWillUnmount() {
    off(this.container, 'tab:focus', this.handleTabFocus)
    off(document, 'ctx:add-extra-fields', this.showFieldPopup)
    this.props.onBlur()
  }

  get isEmpty() {
    return this.props.items.length === 0
  }

  get isBulk() {
    return this.props.items.length > 1
  }

  get hasPhotoFields() {
    return this.props.photo != null && !this.props.photo.pending
  }

  get hasSelectionFields() {
    return this.props.selection != null && !this.props.selection.pending
  }

  get tabIndex() {
    return this.isEmpty ? -1 : TABS.MetadataPanel
  }

  focus = () => {
    this.container.focus()
  }

  next(i = 0) {
    for (let ii = i + 3; i < ii; ++i) {
      let fields = this.fields[i % 3]
      let next = (fields != null) && fields.next()
      if (next) return fields.edit(next.property.id)
    }
  }

  prev(i = 2) {
    for (let ii = i - 2; i >= ii; --i) {
      let fields = this.fields[i % 3]
      let prev = (fields != null) && fields.prev()
      if (prev) return fields.edit(prev.property.id)
    }
  }

  setContainer = (container) => {
    this.container = container
  }

  setItemFields = (item) => {
    this.fields[0] = item
  }

  setPhotoFields = (photo) => {
    this.fields[1] = photo
  }

  setSelectionFields = (selection) => {
    this.fields[2] = selection
  }

  handleAfterItemFields = () => {
    this.next(1)
  }

  handleBeforeItemFields = () => {
    this.prev(2)
  }

  handleAfterPhotoFields = () => {
    this.next(2)
  }

  handleBeforePhotoFields = () => {
    this.prev(0)
  }

  handleAfterSelectionFields = () => {
    this.next(0)
  }

  handleBeforeSelectionFields = () => {
    this.prev(1)
  }

  handleTabFocus = () => {
    this.props.onFocus()
  }

  handleEditCancel = () => {
    this.props.onEditCancel()
    this.focus()
  }

  handleChange = (data) => {
    this.props.onMetadataSave(data)
    this.focus()
  }

  handleTemplateChange = (template, hasChanged) => {
    if (hasChanged || this.isBulk) {
      this.props.onItemSave({
        id: this.props.items.map(it => it.id),
        property: 'template',
        value: template.id
      })
    }
  }

  handleItemContextMenu = (event, data = {}) => {
    this.handleContextMenu(event, { ...data, type: 'item' })
  }

  handlePhotoContextMenu = (event, data = {}) => {
    this.handleContextMenu(event, { ...data, type: 'photo' })
  }

  handleSelectionContextMenu = (event, data = {}) => {
    this.handleContextMenu(event, { ...data, type: 'selection' })
  }

  handleContextMenu(event, data = {}) {
    if (!this.props.isDisabled) {
      let id = (data.type === 'item') ?
        this.props.items.map(it => it.id) :
        [get(this.props, [data.type, 'id'])]

      let context = data.property ?
        'metadata-field' : 'metadata-list'

      this.props.onContextMenu(event, context, { ...data, id })
    }
  }

  showFieldPopup = ({ detail }) => {
    let { id, type } = detail.target

    this.setState({
      fieldPopup: {
        left: detail.x,
        top: detail.y,
        value: this.props.fields[type].map(f => f.property.id),
        onInsert: (property) => {
          this.props.onMetadataAdd({ id, property })
        }
      }
    })
  }

  hideFieldPopup = () => {
    this.setState({ fieldPopup: null })
  }

  handleKeyDown = (event) => {
    switch (match(this.props.keymap, event)) {
      case 'up':
        this.prev()
        break
      case 'down':
      case 'enter':
        this.next()
        break
      default:
        return
    }

    event.stopPropagation()
    event.preventDefault()
  }

  renderItemFields() {
    return !this.isEmpty && (
      <MetadataSection
        count={this.props.items.length}
        onContextMenu={this.handleItemContextMenu}
        title="panel.metadata.item">
        <TemplateSelect
          options={this.props.templates}
          value={this.props.template.id}
          isDisabled={this.props.isDisabled}
          isMixed={this.props.template.mixed}
          isRequired
          onChange={this.handleTemplateChange}/>
        <MetadataList
          ref={this.setItemFields}
          edit={this.props.edit}
          fields={this.props.fields.item}
          isDisabled={this.props.isDisabled}
          onEdit={this.props.onEdit}
          onEditCancel={this.handleEditCancel}
          onContextMenu={this.handleItemContextMenu}
          onChange={this.handleChange}
          onAfter={this.handleAfterItemFields}
          onBefore={this.handleBeforeItemFields}/>
        {!this.isBulk &&
          <ItemInfo item={this.props.items[0]}/>}
      </MetadataSection>
    )
  }

  renderPhotoFields() {
    return this.hasPhotoFields && (
      <MetadataSection
        onContextMenu={this.handlePhotoContextMenu}
        title="panel.metadata.photo">
        <MetadataList
          ref={this.setPhotoFields}
          edit={this.props.edit}
          fields={this.props.fields.photo}
          isDisabled={this.props.isDisabled}
          onEdit={this.props.onEdit}
          onEditCancel={this.handleEditCancel}
          onContextMenu={this.handlePhotoContextMenu}
          onChange={this.handleChange}
          onAfter={this.handleAfterPhotoFields}
          onBefore={this.handleBeforePhotoFields}/>
        <PhotoInfo
          photo={this.props.photo}
          onOpenInFolder={this.props.onOpenInFolder}/>
      </MetadataSection>
    )
  }

  renderSelectionFields() {
    return this.hasSelectionFields && (
      <MetadataSection
        onContextMenu={this.handleSelectionContextMenu}
        title="panel.metadata.selection">
        <MetadataList
          ref={this.setSelectionFields}
          edit={this.props.edit}
          fields={this.props.fields.selection}
          isDisabled={this.props.isDisabled}
          onEdit={this.props.onEdit}
          onEditCancel={this.handleEditCancel}
          onContextMenu={this.handleSelectionContextMenu}
          onChange={this.handleChange}
          onAfter={this.handleAfterSelectionFields}
          onBefore={this.handleBeforeSelectionFields}/>
        <SelectionInfo
          selection={this.props.selection}/>
      </MetadataSection>
    )
  }

  renderFieldPopup() {
    return this.state.fieldPopup != null && (
      <PopupSelect
        {...this.state.fieldPopup}
        isSelectionHidden
        maxRows={6}
        options={this.props.fields.available}
        onClose={this.hideFieldPopup}
        placeholder="panel.metadata.popup.placeholder"/>
    )
  }

  render() {
    return (
      <div className="metadata tab-pane">
        <div
          className="scroll-container"
          ref={this.setContainer}
          tabIndex={this.tabIndex}
          onBlur={this.props.onBlur}
          onKeyDown={this.handleKeyDown}>
          {this.renderItemFields()}
          {this.renderPhotoFields()}
          {this.renderSelectionFields()}
          {this.renderFieldPopup()}
        </div>
      </div>
    )
  }


  static propTypes = {
    edit: object,
    fields: shape({
      available: arrayOf(object).isRequired,
      item: arrayOf(shapes.field).isRequired,
      photo: arrayOf(shapes.field).isRequired,
      selection: arrayOf(shapes.field).isRequired,
    }).isRequired,
    isDisabled: bool,
    items: arrayOf(shapes.subject),
    keymap: object.isRequired,
    photo: shapes.subject,
    selection: shapes.subject,
    template: shapes.template,
    templates: arrayOf(shapes.template).isRequired,

    onBlur: func.isRequired,
    onContextMenu: func.isRequired,
    onEdit: func,
    onEditCancel: func,
    onFocus: func.isRequired,
    onItemSave: func.isRequired,
    onMetadataAdd: func.isRequired,
    onMetadataDelete: func.isRequired,
    onMetadataSave: func.isRequired,
    onOpenInFolder: func.isRequired
  }
}

module.exports = {
  MetadataPanel: connect(
    (state) => ({
      edit: state.edit.field,
      fields: {
        available: getPropertyList(state),
        item: getItemFields(state),
        photo: getPhotoFields(state),
        selection: getSelectionFields(state)
      },
      keymap: state.keymap.MetadataList,
      items: getSelectedItems(state),
      photo: getSelectedPhoto(state),
      selection: getActiveSelection(state),
      template: getSelectedItemTemplate(state),
      templates: getItemTemplates(state)
    }),

    (dispatch) => ({
      onItemSave(...args) {
        dispatch(actions.item.save(...args))
      },

      onMetadataAdd(...args) {
        dispatch(actions.metadata.add(...args))
      },

      onMetadataDelete(...args) {
        dispatch(actions.metadata.delete(...args))
      }
    })
  )(MetadataPanel)
}
