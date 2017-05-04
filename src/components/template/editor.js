'use strict'

const React = require('react')
const { PureComponent } = React
const { TemplateSelect } = require('./select')
const { PropertySelect } = require('../property/select')
const { IconButton } = require('../button')
const { FormattedMessage } = require('react-intl')
const { FormField, FormGroup, Label } = require('../form')
const { arrayOf, func, shape, string } = require('prop-types')

const {
  IconNew,
  IconCopy,
  IconTrash,
  IconImport,
  IconExport,
  IconGrip,
  IconPlusCircle,
  IconMinusCircle
} = require('../icons')


function TemplateControl(props) {
  return (
    <FormGroup className="select-template">
      <Label id="prefs.template.select"/>
      <div className="col-9 flex-row center">
        <TemplateSelect
          templates={props.templates}
          selected={props.selected}
          isRequired={false}
          placeholder="prefs.template.new"
          onChange={props.onChange}/>
        <div className="btn-group">
          <IconButton icon={<IconNew/>}/>
          <IconButton icon={<IconCopy/>}/>
          <IconButton icon={<IconTrash/>}/>
          <IconButton icon={<IconImport/>}/>
          <IconButton icon={<IconExport/>}/>
        </div>
      </div>
    </FormGroup>
  )
}

TemplateControl.propTypes = {
  templates: arrayOf(shape({
    uri: string.isRequired,
    name: string
  })).isRequired,
  selected: string,
  onChange: func.isRequired
}




class TemplateEditor extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      name: '', uri: ''
    }
  }

  handleTemplateChange = (template) => {
    this.setState({ name: '', uri: '', ...template })
  }

  handleTemplateUpdate = (template) => {
    this.setState(template)
  }

  handlePropertyChange = () => {
  }

  render() {
    return (
      <div className="template editor form-horizontal">
        <header className="template-header">
          <TemplateControl
            selected={this.state.uri}
            templates={this.props.templates}
            onChange={this.handleTemplateChange}/>
          <FormField
            id="template.name"
            name="name"
            value={this.state.name}
            isCompact
            onChange={this.handleTemplateUpdate}/>
          <FormField
            id="template.uri"
            name="uri"
            value={this.state.uri}
            isCompact
            onChange={this.handleTemplateUpdate}/>
          <FormGroup>
            <div className="col-12 text-right">
              <button className="btn btn-primary min-width">
                <FormattedMessage id="prefs.template.save"/>
              </button>
            </div>
          </FormGroup>
        </header>

        <ul className="properties">
          <li className="property">
            <div className="property-container">
              <IconGrip/>
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
            </div>
            <IconButton icon={<IconPlusCircle/>}/>
            <IconButton icon={<IconMinusCircle/>}/>
          </li>
        </ul>
      </div>
    )
  }

  static propTypes = {
    properties: arrayOf({
      uri: string.isRequired
    }).isRequired,
    templates: arrayOf(shape({
      uri: string.isRequired,
      name: string
    })).isRequired,
    onCreate: func.isRequired,
    onSave: func.isRequired
  }
}

module.exports = {
  TemplateEditor
}
