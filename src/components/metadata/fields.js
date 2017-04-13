'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const { arrayOf, bool, func, object, shape, string } = PropTypes
const { MetadataField } = require('./field')
const { get } = require('../../common/util')
const { isArray } = Array


class MetadataFields extends PureComponent {

  isEditing(uri) {
    return get(this.props.edit, [uri]) === this.getEditKey()
  }

  isExtra(uri) {
    const { template } = this.props

    if (uri === 'id') return false
    if (!template) return true

    return !template.fields.find(({ property }) => property.uri === uri)
  }

  getEditKey(id = this.props.data.id) {
    return isArray(id) ? 'bulk' : id
  }


  *extras() {
    for (let uri in this.props.data) {
      if (this.isExtra(uri)) yield uri
    }
  }

  handleEdit = (id, uri) => {
    this.props.onEdit({
      field: { [uri]: this.getEditKey(id) }
    })
  }

  renderField = (property, props) => {
    const { data, onChange, onEditCancel } = this.props
    const value = data[property.uri] || {}

    return (
      <MetadataField
        key={property.uri}
        id={data.id}
        property={property}
        type={value.type || property.type}
        text={value.text}
        isEditing={this.isEditing(property.uri)}
        isMixed={!!value.mixed}
        onChange={onChange}
        onEdit={this.handleEdit}
        onEditCancel={onEditCancel}
        {...props}/>
    )
  }

  renderTemplate() {
    return this.props.template.fields.map(f => this.renderField(f.property))
  }

  renderExtraFields() {
    const { properties } = this.props
    return [...this.extras()].map(uri =>
      this.renderField(properties[uri] || { uri }, { isExtra: true })
    )
  }

  render() {
    return (
      <ol className="metadata-fields">
        {this.renderTemplate()}
        {this.renderExtraFields()}
      </ol>
    )
  }

  static propTypes = {
    isDisabled: bool,

    template: shape({
      fields: arrayOf(shape({
        property: object.isRequired
      })).isRequired
    }).isRequired,

    edit: object,
    properties: object.isRequired,
    static: string,

    data: object.isRequired,

    onEdit: func,
    onEditCancel: func,
    onChange: func.isRequired
  }
}


module.exports = {
  MetadataFields
}
