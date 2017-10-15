'use strict'

const React = require('react')
const { PureComponent } = React
const { MetadataField } = require('./field')
const { get } = require('../../common/util')
const { isArray } = Array
const {
  arrayOf, bool, func, number, object, oneOfType, shape, string
} =  require('prop-types')


class MetadataList extends PureComponent {
  get isEmpty() {
    return this.props.data == null
  }

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

  renderTemplateFields() {
    const { template } = this.props
    return template && template.fields.map(f =>
      this.renderField(f.property, {
        isReadOnly: f.isConstant,
        isRequired: f.isRequired,
        label: f.label,
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
    return !this.isEmpty && (
      <ol className="metadata-fields">
        {this.renderTemplateFields()}
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

    data: shape({
      id: oneOfType([number, arrayOf(number)]).isRequired
    }),

    onEdit: func,
    onEditCancel: func,
    onChange: func.isRequired
  }
}


module.exports = {
  MetadataList
}
