'use strict'

const React = require('react')
const { PureComponent } = React
const { MetadataField } = require('./field')
const { get } = require('../../common/util')
const { isArray } = Array
const { arrayOf, bool, func, object, shape, string } =  require('prop-types')


class MetadataList extends PureComponent {
  get isEmpty() {
    return this.props.fields.length === 0
  }

  isEditing(key) {
    return get(this.props.edit, [key]) === this.getEditKey()
  }

  getEditKey(id = this.props.fields.id) {
    return isArray(id) ? 'bulk' : id
  }

  handleEdit = (id, key) => {
    this.props.onEdit({
      field: { [key]: this.getEditKey(id) }
    })
  }

  render() {
    return (
      <ol className="metadata-fields">
        {this.props.fields.map(({ property, value, type, ...props }) =>
          <MetadataField
            {...props}
            key={property.id}
            id={this.props.fields.id}
            isDisabled={this.props.isDisabled}
            isEditing={this.isEditing(property.id)}
            isMixed={!!value.mixed}
            property={property}
            text={value.text}
            type={value.type || type}
            onChange={this.props.onChange}
            onEdit={this.handleEdit}
            onEditCancel={this.props.onEditCancel}/>
        )}
      </ol>
    )
  }

  static propTypes = {
    isDisabled: bool,
    edit: object,
    fields: arrayOf(shape({
      isExtra: bool.isRequired,
      isRequired: bool,
      label: string,
      property: object.isRequired,
      value: object
    })).isRequired,
    onEdit: func,
    onEditCancel: func,
    onChange: func.isRequired
  }
}


module.exports = {
  MetadataList
}
