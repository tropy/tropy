'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { Field } = require('./field')
const { get } = require('../../common/util')
const { isArray } = Array


class Fields extends PureComponent {

  get editKey() {
    return isArray(this.props.data.id) ? 'bulk' : this.props.data.id
  }

  isEditing(uri) {
    return get(this.props.edit, [uri]) === this.editKey
  }

  isExtra(uri) {
    const { template } = this.props

    if (uri === 'id') return false
    if (!template) return true

    return !template.fields.find(({ property }) => property.uri === uri)
  }

  *extras() {
    for (let uri in this.props.data) {
      if (this.isExtra(uri)) yield uri
    }
  }

  renderTemplateFields() {
    const { template, ...props } = this.props

    if (!template) return

    return template.fields.map(({ property }) =>
      <Field {...props}
        key={property.uri}
        property={property}
        isEditing={this.isEditing(property.uri)}/>
    )
  }

  renderExtraFields() {
    const { properties, ...props } = this.props

    return [...this.extras()].map(uri =>
      <Field {...props}
        key={uri}
        property={properties[uri] || { uri }}
        isExtra
        isEditing={this.isEditing(uri)}/>
    )
  }

  render() {
    return (
      <ol className="metadata-fields">
        {this.renderTemplateFields()}
        {this.renderExtraFields()}
      </ol>
    )
  }

  static propTypes = {
    isDisabled: PropTypes.bool,

    template: PropTypes.shape({
      fields: PropTypes.arrayOf(PropTypes.shape({
        property: PropTypes.object.isRequired
      })).isRequired,
    }),

    edit: PropTypes.object,
    properties: PropTypes.object.isRequired,
    static: PropTypes.string,

    data: PropTypes.object.isRequired,

    onEdit: PropTypes.func,
    onEditCancel: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    onContextMenu: PropTypes.func
  }

  static defaultProps = {
    data: {}
  }
}


module.exports = {
  Fields
}
