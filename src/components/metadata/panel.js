'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { arrayOf, bool, func, number, object, shape, string } = PropTypes
const { FormattedMessage } = require('react-intl')
const { MetadataFields } = require('./fields')
const { TemplateSelect } = require('./select')


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
      bulk,
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
          data={bulk}
          template={templates[item.template]}
          isDisabled={isDisabled}
          onChange={onMetadataSave}/>
      </section>
    )
  }

  renderPhotoFields() {
    if (this.isEmpty || this.isBulk) return null

    const { photo, data, templates, onMetadataSave, ...props } = this.props

    return photo && (
      <section>
        <h5 className="metadata-heading separator">
          <FormattedMessage id="panel.metadata.photo"/>
        </h5>
        <MetadataFields {...props}
          data={data[photo.id]}
          template={templates[photo.template]}
          onChange={onMetadataSave}/>
      </section>
    )
  }

  render() {
    return (
      <div className="metadata tab-pane">
        {this.renderItemFields()}
        {this.renderPhotoFields()}
      </div>
    )
  }

  static propTypes = {
    isDisabled: bool,

    data: object.isRequired,
    bulk: object.isRequired,

    templates: object.isRequired,

    items: arrayOf(shape({
      id: number.isRequired,
      template: string.isRequired
    })),

    photo: shape({
      id: number.isRequired,
      template: string.isRequired
    }),

    onItemSave: func.isRequired,
    onMetadataSave: func.isRequired
  }
}

module.exports = {
  MetadataPanel
}

