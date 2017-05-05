'use strict'

const React = require('react')
const { PureComponent } = React
const { PropertySelect } = require('../property/select')
const { IconButton } = require('../button')
const { FormField, FormGroup, Label } = require('../form')
const { IconGrip, IconPlusCircle, IconMinusCircle } = require('../icons')
const { get, titlecase } = require('../../common/util')
const { basename } = require('path')
const { array, func, object } = require('prop-types')


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

  handleInsert = () => {
    this.props.onInsert(this.props.field)
  }

  handleRemove = () => {
    this.props.onRemove(this.props.field)
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
        <IconButton
          icon={<IconPlusCircle/>}
          onClick={this.handleInsert}/>
        <IconButton
          icon={<IconMinusCircle/>}
          onClick={this.handleRemove}/>
      </li>
    )
  }

  static propTypes = {
    field: object.isRequired,
    properties: array.isRequired,
    onInsert: func.isRequired,
    onRemove: func.isRequired
  }
}


module.exports = {
  TemplateField
}
