'use strict'

const React = require('react')
const { PureComponent } = React
const { PropertySelect } = require('../property/select')
const { IconButton } = require('../button')
const { FormField, FormGroup, Label } = require('../form')
const { array, object } = require('prop-types')
const { IconGrip, IconPlusCircle, IconMinusCircle } = require('../icons')


class TemplateField extends PureComponent {

  handlePropertyChange = () => {
  }

  render() {
    return (
      <li className="template-field">
        <IconGrip/>
        <fieldset>
          <FormGroup isCompact>
            <Label id="template.property"/>
            <div className="col-9">
              <PropertySelect
                properties={this.props.properties}
                selected={''}
                isRequired={false}
                placeholder="property.select"
                onChange={this.handlePropertyChange}/>
            </div>
          </FormGroup>
          <FormField
            id="property.label"
            name="label"
            value="Title"
            onChange={this.handlePropertyChange}/>
        </fieldset>
        <IconButton icon={<IconPlusCircle/>}/>
        <IconButton icon={<IconMinusCircle/>}/>
      </li>
    )
  }

  static propTypes = {
    field: object.isRequired,
    properties: array.isRequired
  }
}


module.exports = {
  TemplateField
}
