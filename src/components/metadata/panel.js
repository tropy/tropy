'use strict'

const React = require('react')
const { connect } = require('react-redux')
const { FormattedMessage } = require('react-intl')
const { MetadataList } = require('./list')
const { TemplateSelect } = require('../template/select')
const { PopupSelect } = require('../resource/popup')
const { PhotoInfo } = require('../photo/info')
const { ItemInfo } = require('../item/info')
const { SelectionInfo } = require('../selection/info')
const { TABS } = require('../../constants')
const { match } = require('../../keymap')
const { on, off } = require('../../dom')
const { get } = require('../../common/util')
const { text } = require('../../value')
const actions = require('../../actions')

const {
  arrayOf, bool, func, number, object, shape, string
} = require('prop-types')

const shapes = {
  field: shape({
    isExtra: bool.isRequired,
    property: object.isRequired
  }),
  subject: shape({
    id: number.isRequired,
    template: string
  }),
  template: shape({
    id: string.isRequired,
    mixed: bool
  })
}

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
      fieldsPopup: null
    }
  }

  componentDidMount() {
    on(this.container, 'tab:focus', this.handleTabFocus)
    on(document, 'ctx:add-extra-field', this.showFieldsPopup)
  }

  componentWillUnmount() {
    off(this.container, 'tab:focus', this.handleTabFocus)
    off(document, 'ctx:add-extra-fields', this.showFieldsPopup)
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

  handleItemContextMenu = (event) => {
    this.props.onContextMenu(event, 'metadata', {
      type: 'item'
    })
  }

  handlePhotoContextMenu = (event) => {
    this.props.onContextMenu(event, 'metadata', {
      type: 'photo'
    })
  }

  handleSelectionContextMenu = (event) => {
    this.props.onContextMenu(event, 'metadata', {
      type: 'selection'
    })
  }

  getSubjectIds(type) {
    if (type === 'item') {
      return this.props.items.map(it => it.id)
    } else {
      return [get(this.props, [type, 'id'])]
    }
  }

  showFieldsPopup = ({ detail }) => {
    let type = get(detail, ['target', 'type'], 'item')
    let ids = this.getSubjectIds(type)

    this.setState({
      fieldsPopup: {
        left: detail.x,
        top: detail.y,
        value: this.props.fields[type].map(f => f.property.id),
        onInsert: (prop) => this.props.onMetadataInsert(ids, prop)
      }
    })
  }

  hideFieldsPopup = () => {
    this.setState({ fieldsPopup: null })
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
      <section onContextMenu={this.handleItemContextMenu}>
        <h5 className="metadata-heading">
          <FormattedMessage
            id="panel.metadata.item"
            values={{ count: this.props.items.length }}/>
        </h5>
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
          onChange={this.handleChange}
          onAfter={this.handleAfterItemFields}
          onBefore={this.handleBeforeItemFields}/>
        {!this.isBulk && <ItemInfo item={this.props.items[0]}/>}
      </section>
    )
  }

  renderPhotoFields() {
    if (this.isEmpty || this.isBulk) return null
    let { photo } = this.props

    return photo && !photo.pending && (
      <section onContextMenu={this.handlePhotoContextMenu}>
        <h5 className="metadata-heading separator">
          <FormattedMessage id="panel.metadata.photo"/>
        </h5>
        <MetadataList
          ref={this.setPhotoFields}
          edit={this.props.edit}
          fields={this.props.fields.photo}
          isDisabled={this.props.isDisabled}
          onEdit={this.props.onEdit}
          onEditCancel={this.handleEditCancel}
          onChange={this.handleChange}
          onAfter={this.handleAfterPhotoFields}
          onBefore={this.handleBeforePhotoFields}/>
        <PhotoInfo
          photo={photo}
          onOpenInFolder={this.props.onOpenInFolder}/>
      </section>
    )
  }

  renderSelectionFields() {
    if (this.isEmpty || this.isBulk) return null
    let { selection } = this.props

    return selection != null && !selection.pending && (
      <section onContextMenu={this.handleSelectionContextMenu}>
        <h5 className="metadata-heading separator">
          <FormattedMessage id="panel.metadata.selection"/>
        </h5>
        <MetadataList
          ref={this.setSelectionFields}
          edit={this.props.edit}
          fields={this.props.fields.selection}
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

  renderFieldsPopup() {
    return this.state.fieldsPopup != null && (
      <PopupSelect
        {...this.state.fieldsPopup}
        isSelectionHidden
        maxRows={6}
        options={this.props.fields.available}
        onClose={this.hideFieldsPopup}
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
          {this.renderFieldsPopup()}
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
    onMetadataInsert: func.isRequired,
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
      items: getSelectedItems(state),
      photo: getSelectedPhoto(state),
      selection: getActiveSelection(state),
      template: getSelectedItemTemplate(state),
      templates: getItemTemplates(state),
    }),

    (dispatch) => ({
      onMetadataInsert(ids, prop) {
        dispatch(actions.metadata.update({
          ids, data: { [prop]: text('') }
        }))
      }
    })
  )(MetadataPanel)
}
