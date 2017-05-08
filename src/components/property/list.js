'use strict'

const React = require('react')
const { PureComponent } = React
const { FormField, FormText } = require('../form')
const { array, object } = require('prop-types')
const { noop } = require('../../common/util')


const PropertyListItem = ({ property }) => (
  <li className="property">
    <fieldset>
      <FormField
        id="property.label"
        name="label"
        value={property.label}
        isCompact
        size={8}
        onChange={noop}/>
      <FormText
        id="property.uri"
        isCompact
        size={8}
        value={property.uri}/>
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

PropertyListItem.propTypes = {
  property: object.isRequired
}


class PropertyList extends PureComponent {

  render() {
    return (
      <ul className="property-list">
        {this.props.properties.map(property =>
          <PropertyListItem key={property.uri} property={property}/>)}
      </ul>
    )
  }

  static propTypes = {
    properties: array.isRequired
  }
}

module.exports = {
  PropertyList
}
