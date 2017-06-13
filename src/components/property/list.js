'use strict'

const React = require('react')
const { PureComponent } = React
const { FormField, FormLink, FormText } = require('../form')
const { array, func, object } = require('prop-types')


class PropertyListItem extends PureComponent {
  handleChange = (data) => {
    this.props.onSave({ id: this.props.property.id, ...data })
  }

  render() {
    const { property, onOpenLink } = this.props

    return (
      <li className="property">
        <fieldset>
          <FormField
            id="property.label"
            name="label"
            value={property.label}
            isCompact
            size={8}
            onChange={this.handleChange}/>
          <FormLink
            id="property.id"
            isCompact
            size={8}
            value={property.id}
            onClick={onOpenLink}/>
          <FormText
            id="property.comment"
            isCompact
            isOptional
            size={8}
            value={property.comment}/>
          <FormText
            id="property.description"
            isCompact
            isOptional
            size={8}
            value={property.definition}/>
        </fieldset>
      </li>
    )
  }

  static propTypes = {
    property: object.isRequired,
    onOpenLink: func.isRequired,
    onSave: func.isRequired
  }
}


class PropertyList extends PureComponent {
  render() {
    return (
      <ul className="property-list">
        {this.props.properties.map(property =>
          <PropertyListItem
            key={property.id}
            property={property}
            onOpenLink={this.props.onOpenLink}
            onSave={this.props.onSave}/>)}
      </ul>
    )
  }

  static propTypes = {
    properties: array.isRequired,
    onOpenLink: func.isRequired,
    onSave: func.isRequired
  }
}

module.exports = {
  PropertyList
}
