'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { bool, func, number, object, shape, string } = PropTypes
const { FormattedMessage } = require('react-intl')
const { Fields } = require('./fields')
const { TemplateSelect } = require('./select')


class MetadataPanel extends PureComponent {

  handleTemplateChange = (event) => {
    this.props.onItemSave({
      id: this.props.item.id,
      property: 'template',
      value: event.target.value
    })
  }

  renderItemFields() {
    const { item, data, templates, isDisabled, ...props } = this.props

    return item && (
      <section>
        <h5 className="metadata-heading">
          <FormattedMessage id="panel.metadata.item"/>
        </h5>
        <TemplateSelect
          templates={templates}
          selected={item.template}
          isDisabled={isDisabled}
          onChange={this.handleTemplateChange}/>
        <Fields {...props}
          subject={item}
          data={data[item.id]}
          template={templates[item.template]}
          isDisabled={isDisabled}/>
      </section>
    )
  }

  renderPhotoFields() {
    const { photo, data, templates, ...props } = this.props

    return photo && (
      <section>
        <h5 className="metadata-heading separator">
          <FormattedMessage id="panel.metadata.photo"/>
        </h5>
        <Fields {...props}
          subject={photo}
          data={data[photo.id]}
          template={templates[photo.template]}/>
      </section>
    )
  }

  render() {
    return (
      <div className="metadata-container">
        {this.renderItemFields()}
        {this.renderPhotoFields()}
      </div>
    )
  }

  static propTypes = {
    isDisabled: bool,

    data: object.isRequired,
    templates: object.isRequired,

    item: shape({
      id: number.isRequired,
      template: string.isRequired
    }),

    photo: shape({
      id: number.isRequired,
      template: string.isRequired
    }),

    onItemSave: func.isRequired
  }
}

module.exports = {
  MetadataPanel
}

