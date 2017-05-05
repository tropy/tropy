'use strict'

const React = require('react')
const { PureComponent } = React
const { TemplateSelect } = require('./select')
const { TemplateField } = require('./field')
const { ButtonGroup, IconButton } = require('../button')
const { FormattedMessage } = require('react-intl')
const { FormField, FormGroup, Label } = require('../form')
const { insert, remove } = require('../../common/util')
const { arrayOf, func, shape, string } = require('prop-types')

const {
  IconNew,
  IconCopy,
  IconTrash,
  IconImport,
  IconExport,
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
        <ButtonGroup>
          <IconButton icon={<IconNew/>}/>
          <IconButton icon={<IconCopy/>}/>
          <IconButton icon={<IconTrash/>}/>
          <IconButton icon={<IconImport/>}/>
          <IconButton icon={<IconExport/>}/>
        </ButtonGroup>
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


function dup(template) {
  template = template || { name: '', uri: '', fields: [] }
  return {
    ...template, fields: [...template.fields]
  }
}

class TemplateEditor extends PureComponent {
  constructor(props) {
    super(props)
    this.state = dup()
  }

  handleTemplateChange = (template) => {
    this.setState(dup(template))
  }

  handleTemplateUpdate = (template) => {
    this.setState(template)
  }

  handleFieldInsert = (field) => {
    const at = this.state.fields.indexOf(field)

    this.setState({
      fields: insert(this.state.fields, at + 1, dup())
    })
  }

  handleFieldRemove = (field) => {
    this.setState({
      fields: remove(this.state.fields, field)
    })
  }

  handleSort = () => {
  }

  handleSortPreview = () => {
  }

  handleSortReset = () => {
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

        <ul className="template-field-list">
          {this.state.fields.map((field, idx) =>
            <TemplateField
              key={idx}
              field={field}
              properties={this.props.properties}
              onInsert={this.handleFieldInsert}
              onRemove={this.handleFieldRemove}
              onSort={this.handleSort}
              onSortPreview={this.handleSortPreview}
              onSortReset={this.handleSortReset}/>)}
        </ul>
      </div>
    )
  }

  static propTypes = {
    properties: arrayOf(shape({
      uri: string.isRequired
    })).isRequired,
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
