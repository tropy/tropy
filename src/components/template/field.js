'use strict'

const React = require('react')
const { PureComponent } = React
const { PropertySelect } = require('../property/select')
const { IconButton } = require('../button')
const { FormField, FormGroup, Label } = require('../form')
const { array, object } = require('prop-types')
const { IconGrip, IconPlusCircle, IconMinusCircle } = require('../icons')
const { get, titlecase } = require('../../common/util')
const { basename } = require('path')


class TemplateField extends PureComponent {

  get uri() {
    return get(this.props.field, ['property', 'uri']) || ''
  }

  get defaultLabel() {
    return get(this.props.field, ['property', 'label'])
      || titlecase(basename(this.uri))
  }

  handlePropertyChange = () => {
  }

  render() {
    return (
      <li className="template-field">
        <IconGrip/>
        <fieldset>
          <FormGroup isCompact>
            <Label id="template.field.property"/>
            <div className="col-9">
              <PropertySelect
                properties={this.props.properties}
                selected={this.uri}
                isRequired={false}
                placeholder="property.select"
                onChange={this.handlePropertyChange}/>
            </div>
          </FormGroup>
          <FormField
            id="template.field.label"
            name="label"
            value={this.props.field.label || ''}
            placeholder={this.defaultLabel}
            onChange={this.handlePropertyChange}/>
          <FormField
            id="template.field.hint"
            name="hint"
            value={this.props.field.hint || ''}
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
