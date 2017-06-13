'use strict'

const React = require('react')
const { PureComponent } = React
const { FormField, FormLink, FormText } = require('../form')
const { array, func, object } = require('prop-types')
const { noop } = require('../../common/util')


const PropertyListItem = ({ property, onOpenLink }) => (
  <li className="property">
    <fieldset>
      <FormField
        id="property.label"
        name="label"
        value={property.label}
        isCompact
        size={8}
        onChange={noop}/>
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

PropertyListItem.propTypes = {
  property: object.isRequired,
  onOpenLink: func.isRequired
}


class PropertyList extends PureComponent {

  render() {
    return (
      <ul className="property-list">
        {this.props.properties.map(property =>
          <PropertyListItem
            key={property.id}
            property={property}
            onOpenLink={this.props.onOpenLink}/>)}
      </ul>
    )
  }

  static propTypes = {
    properties: array.isRequired,
    onOpenLink: func.isRequired
  }
}

module.exports = {
  PropertyList
}
