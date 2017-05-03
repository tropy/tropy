'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const { arrayOf, bool, func, number, object, shape, string } = PropTypes
const { connect } = require('react-redux')
const { FormattedMessage } = require('react-intl')
const { MetadataFields } = require('./fields')
const { TemplateSelect } = require('../template/select')

const {
  getSelectedItems, getItemMetadata, getSelectedPhoto, getTemplates
} = require('../../selectors')


class MetadataPanel extends PureComponent {
  get isEmpty() {
    return this.props.items.length === 0
  }

  get isBulk() {
    return this.props.items.length > 1
  }

  handleTemplateChange = (event) => {
    this.props.onItemSave({
      id: this.props.items.map(it => it.id),
      property: 'template',
      value: event.target.value
    })
  }

  renderItemFields() {
    if (this.isEmpty) return null

    const {
      items,
      itemsData,
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
          templates={templates}
          selected={item.template}
          isDisabled={isDisabled}
          onChange={this.handleTemplateChange}/>
        <MetadataFields {...props}
          data={itemsData}
          template={templates[item.template]}
          isDisabled={isDisabled}
          onChange={onMetadataSave}/>
      </section>
    )
  }

  renderPhotoFields() {
    if (this.isEmpty || this.isBulk) return null

    const { photo, photoData, templates, onMetadataSave, ...props } = this.props

    return photo && (
      <section>
        <h5 className="metadata-heading separator">
          <FormattedMessage id="panel.metadata.photo"/>
        </h5>
        <MetadataFields {...props}
          data={photoData}
          template={templates[photo.template]}
          onChange={onMetadataSave}/>
      </section>
    )
  }

  render() {
    return (
      <div className="metadata tab-pane">
        <div className="scroll-container">
          {this.renderItemFields()}
          {this.renderPhotoFields()}
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
      template: string.isRequired
    }),
    photoData: object,

    templates: object.isRequired,

    onItemSave: func.isRequired,
    onMetadataSave: func.isRequired
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
      templates: getTemplates(state)
    })
  )(MetadataPanel)
}

