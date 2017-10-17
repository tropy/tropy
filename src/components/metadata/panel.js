'use strict'

const React = require('react')
const { PureComponent } = React
const { connect } = require('react-redux')
const { FormattedMessage } = require('react-intl')
const { MetadataList } = require('./list')
const { TemplateSelect } = require('../template/select')
const { PhotoInfo } = require('../photo/info')
const { ItemInfo } = require('../item/info')
const { SelectionInfo } = require('../selection/info')
const { TABS } = require('../../constants')
const { match } = require('../../keymap')
const { on, off } = require('../../dom')

const {
  arrayOf, bool, func, number, object, shape, string
} = require('prop-types')

const {
  getActiveSelection,
  getItemTemplates,
  getItemFields,
  getPhotoFields,
  getSelectionFields,
  getSelectedItems,
  getSelectedPhoto
} = require('../../selectors')


class MetadataPanel extends PureComponent {
  constructor(props) {
    super(props)
    this.fields = [null, null, null]
  }

  componentDidMount() {
    on(this.container, 'tab:focus', this.handleTabFocus)
  }

  componentWillUnmount() {
    off(this.container, 'tab:focus', this.handleTabFocus)
    this.props.onBlur()
  }

  get isEmpty() {
    return this.props.items.length === 0
  }

  get isBulk() {
    return this.props.items.length > 1
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
    this.props.onDeactivate()
  }

  handleBlur = () => {
    this.props.onBlur()
    this.props.onDeactivate()
  }

  handleEditCancel = () => {
    this.props.onEditCancel()
    this.props.onDeactivate()
    this.focus()
  }

  handleChange = (data) => {
    this.props.onMetadataSave(data)
    this.props.onDeactivate()
    this.focus()
  }

  handleTemplateChange = (template) => {
    this.props.onItemSave({
      id: this.props.items.map(it => it.id),
      property: 'template',
      value: template.id
    })
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
    const {
      items,
      itemFields,
      templates,
      isDisabled,
      onActivate
    } = this.props

    return !this.isEmpty && (
      <section>
        <h5 className="metadata-heading">
          <FormattedMessage
            id="panel.metadata.item"
            values={{ count: items.length }}/>
        </h5>
        <TemplateSelect
          templates={templates}
          selected={items[0].template}
          isDisabled={isDisabled}
          onChange={this.handleTemplateChange}
          onFocus={onActivate}/>
        <MetadataList
          ref={this.setItemFields}
          edit={this.props.edit}
          fields={itemFields}
          isDisabled={this.props.isDisabled}
          onEdit={this.props.onEdit}
          onEditCancel={this.handleEditCancel}
          onChange={this.handleChange}
          onAfter={this.handleAfterItemFields}
          onBefore={this.handleBeforeItemFields}/>
        {!this.isBulk && <ItemInfo item={items[0]}/>}
      </section>
    )
  }

  renderPhotoFields() {
    if (this.isEmpty || this.isBulk) return null
    const { photo, photoFields, onOpenInFolder } = this.props

    return photo && !photo.pending && (
      <section>
        <h5 className="metadata-heading separator">
          <FormattedMessage id="panel.metadata.photo"/>
        </h5>
        <MetadataList
          ref={this.setPhotoFields}
          edit={this.props.edit}
          fields={photoFields}
          isDisabled={this.props.isDisabled}
          onEdit={this.props.onEdit}
          onEditCancel={this.handleEditCancel}
          onChange={this.handleChange}
          onAfter={this.handleAfterPhotoFields}
          onBefore={this.handleBeforePhotoFields}/>
        <PhotoInfo
          photo={photo}
          onOpenInFolder={onOpenInFolder}/>
      </section>
    )
  }

  renderSelectionFields() {
    if (this.isEmpty || this.isBulk) return null
    const { selection, selectionFields } = this.props

    return selection != null && !selection.pending && (
      <section>
        <h5 className="metadata-heading separator">
          <FormattedMessage id="panel.metadata.selection"/>
        </h5>
        <MetadataList
          ref={this.setSelectionFields}
          edit={this.props.edit}
          fields={selectionFields}
          isDisabled={this.props.isDisabled}
          onEdit={this.props.onEdit}
          onEditCancel={this.handleEditCancel}
          onChange={this.handleChange}
          onAfter={this.handleAfterSelectionFields}
          onBefore={this.handleBeforeSelectionFields}/>
        <SelectionInfo
          selection={selection}/>
      </section>
    )
  }

  render() {
    return (
      <div className="metadata tab-pane">
        <div
          className="scroll-container"
          ref={this.setContainer}
          tabIndex={this.tabIndex}
          onBlur={this.handleBlur}
          onKeyDown={this.handleKeyDown}>
          {this.renderItemFields()}
          {this.renderPhotoFields()}
          {this.renderSelectionFields()}
        </div>
      </div>
    )
  }

  static propTypes = {
    isDisabled: bool,

    edit: object,
    items: arrayOf(shape({
      id: number.isRequired,
      template: string.isRequired
    })),
    itemFields: arrayOf(shape({
      isExtra: bool.isRequired,
      property: object.isRequired
    })).isRequired,

    photo: shape({
      id: number.isRequired,
      template: string
    }),
    photoFields: arrayOf(shape({
      isExtra: bool.isRequired,
      property: object.isRequired
    })).isRequired,

    keymap: object.isRequired,
    templates: arrayOf(object).isRequired,

    selection: shape({
      id: number.isRequired,
      template: string
    }),
    selectionFields: arrayOf(shape({
      isExtra: bool.isRequired,
      property: object.isRequired
    })).isRequired,

    onActivate: func.isRequired,
    onBlur: func.isRequired,
    onDeactivate: func.isRequired,
    onEdit: func,
    onEditCancel: func,
    onFocus: func.isRequired,
    onItemSave: func.isRequired,
    onMetadataSave: func.isRequired,
    onOpenInFolder: func.isRequired
  }
}

module.exports = {
  MetadataPanel: connect(
    (state) => ({
      edit: state.edit.field,
      items: getSelectedItems(state),
      itemFields: getItemFields(state),
      photo: getSelectedPhoto(state),
      photoFields: getPhotoFields(state),
      templates: getItemTemplates(state),
      selection: getActiveSelection(state),
      selectionFields: getSelectionFields(state)
    })
  )(MetadataPanel)
}

