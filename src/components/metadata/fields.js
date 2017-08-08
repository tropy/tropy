'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const { arrayOf, bool, func, object, shape, string } = PropTypes
const { MetadataField } = require('./field')
const { get } = require('../../common/util')
const { isArray } = Array


class MetadataFields extends PureComponent {

  isEditing(key) {
    return get(this.props.edit, [key]) === this.getEditKey()
  }

  isExtra(key) {
    const { template } = this.props

    if (key === 'id') return false
    if (template == null) return true

    return !template.fields.find(({ property }) => property.id === key)
  }

  getEditKey(id = this.props.data.id) {
    return isArray(id) ? 'bulk' : id
  }


  *extras() {
    for (let key in this.props.data) {
      if (this.isExtra(key)) yield key
    }
  }

  handleEdit = (id, key) => {
    this.props.onEdit({
      field: { [key]: this.getEditKey(id) }
    })
  }

  renderField = (property, props) => {
    const { data, isDisabled, onChange, onEditCancel } = this.props
    const value = data[property.id] || {}

    return (
      <MetadataField
        key={property.id}
        id={data.id}
        property={property}
        type={value.type || props.type}
        text={value.text}
        isDisabled={isDisabled}
        isEditing={this.isEditing(property.id)}
        isMixed={!!value.mixed}
        onChange={onChange}
        onEdit={this.handleEdit}
        onEditCancel={onEditCancel}
        {...props}/>
    )
  }

  renderTemplate() {
    const { template } = this.props
    return template && template.fields.map(f =>
      this.renderField(f.property, {
        isReadOnly: f.isConstant,
        isRequired: f.isRequired,
        placeholder: f.hint,
        type: f.datatype
      }))
  }

  renderExtraFields() {
    const { properties } = this.props
    return [...this.extras()].map(id =>
      this.renderField(properties[id] || { id }, { isExtra: true })
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
        property: object.isRequired,
        datatype: string
      })).isRequired
    }),

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
