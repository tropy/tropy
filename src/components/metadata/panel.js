'use strict'

const React = require('react')
const { PureComponent } = React
const { connect } = require('react-redux')
const { FormattedMessage } = require('react-intl')
const { MetadataFields } = require('./fields')
const { TemplateSelect } = require('../template/select')
const { PhotoInfo } = require('../photo/info')
const { ItemInfo } = require('../item/info')
const { SelectionInfo } = require('../selection/info')

const {
  arrayOf, bool, func, number, object, shape, string
} = require('prop-types')

const {
  getActiveSelection,
  getActiveSelectionData,
  getAllTemplates,
  getItemMetadata,
  getItemTemplates,
  getSelectedItems,
  getSelectedPhoto
} = require('../../selectors')


class MetadataPanel extends PureComponent {
  get isEmpty() {
    return this.props.items.length === 0
  }

  get isBulk() {
    return this.props.items.length > 1
  }

  handleTemplateChange = (template) => {
    this.props.onItemSave({
      id: this.props.items.map(it => it.id),
      property: 'template',
      value: template.id
    })
  }

  renderItemFields() {
    if (this.isEmpty) return null

    const {
      items,
      itemsData,
      itemTemplates,
      templates,
      isDisabled,
      onMetadataSave,
      ...props
    } = this.props

    const item = items[0]

    return (
      <section>
        <h5 className="metadata-heading">
          <FormattedMessage id="panel.metadata.item"/>
        </h5>
        <TemplateSelect
          templates={itemTemplates}
          selected={item.template}
          isDisabled={isDisabled}
          onChange={this.handleTemplateChange}/>
        <MetadataFields {...props}
          data={itemsData}
          template={templates[item.template]}
          isDisabled={isDisabled}
          onChange={onMetadataSave}/>
        {items.length === 1 && <ItemInfo item={item}/>}
      </section>
    )
  }

  renderPhotoFields() {
    if (this.isEmpty || this.isBulk) return null

    const {
      photo,
      photoData,
      templates,
      onMetadataSave,
      onOpenInFolder,
      ...props
    } = this.props

    return photo && !photo.pending && (
      <section>
        <h5 className="metadata-heading separator">
          <FormattedMessage id="panel.metadata.photo"/>
        </h5>
        <MetadataFields {...props}
          data={photoData}
          template={templates[photo.template]}
          onChange={onMetadataSave}/>
        <PhotoInfo
          photo={photo}
          onOpenInFolder={onOpenInFolder}/>
      </section>
    )
  }

  renderSelectionFields() {
    if (this.isEmpty || this.isBulk) return null

    const {
      selection,
      selectionData,
      templates,
      onMetadataSave,
      onOpenInFolder,
      ...props
    } = this.props

    return selection && !selection.pending && (
      <section>
        <h5 className="metadata-heading separator">
          <FormattedMessage id="panel.metadata.selection"/>
        </h5>
        <MetadataFields {...props}
          data={selectionData}
          template={templates[selection.template]}
          onChange={onMetadataSave}/>
        <SelectionInfo
          selection={selection}/>
      </section>
    )
  }

  render() {
    return (
      <div className="metadata tab-pane">
        <div className="scroll-container">
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
    itemsData: object.isRequired,

    photo: shape({
      id: number.isRequired,
      template: string
    }),
    photoData: object,

    templates: object.isRequired,
    itemTemplates: arrayOf(object).isRequired,

    selection: shape({
      id: number.isRequired,
      template: string
    }),
    selectionData: object,

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
      itemsData: getItemMetadata(state),
      photo: getSelectedPhoto(state),
      photoData: state.metadata[state.nav.photo],
      templates: getAllTemplates(state),
      itemTemplates: getItemTemplates(state),
      selection: getActiveSelection(state),
      selectionData: getActiveSelectionData(state)
    })
  )(MetadataPanel)
}

