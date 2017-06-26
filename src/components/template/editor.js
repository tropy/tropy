'use strict'

const React = require('react')
const { PureComponent } = React
const { TemplateSelect } = require('./select')
const { TemplateField } = require('./field')
const { ButtonGroup, IconButton } = require('../button')
const { FormattedMessage } = require('react-intl')
const { FormField, FormGroup, FormSelect, Label } = require('../form')
const { insert, remove, move } = require('../../common/util')
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
          <IconButton
            icon={<IconTrash/>}
            isDisabled={!props.selected}
            onClick={props.onDelete}/>
          <IconButton icon={<IconImport/>}
            onClick={props.onImport}/>
          <IconButton icon={<IconExport/>}/>
        </ButtonGroup>
      </div>
    </FormGroup>
  )
}

TemplateControl.propTypes = {
  templates: arrayOf(shape({
    id: string.isRequired,
    name: string
  })).isRequired,
  selected: string,
  onChange: func.isRequired,
  onDelete: func.isRequired,
  onImport: func.isRequired
}


function dup(template) {
  template = template || { name: '', id: '', fields: [], type: 'item' }
  return {
    ...template, fields: [...template.fields]
  }
}

class TemplateEditor extends PureComponent {
  constructor(props) {
    super(props)
    this.state = dup()
  }

  get isPristine() {
    return this.state.created == null
  }

  get isValid() {
    return this.state.id !== '' && this.state.name !== ''
  }

  handleTemplateDelete = () => {
    if (this.state.id) {
      this.props.onDelete([this.state.id])
      this.setState(dup())
    }
  }

  handleTemplateCreate = () => {
    this.props.onCreate({
      id: this.state.id,
      name: this.state.name,
      type: this.state.type
    })
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
      fields: insert(this.state.fields, at + 1, {
        property: { id: '' }
      })
    })
  }

  handleFieldRemove = (field) => {
    this.setState({
      fields: remove(this.state.fields, field)
    })
  }

  handleSort = () => {
  }

  handleSortPreview = (from, to, offset) => {
    this.setState({
      fields: move(this.state.fields, from, to, offset)
    })
  }

  handleSortReset = () => {
  }

  render() {
    return (
      <div className="template editor form-horizontal">
        <header className="template-header">
          <TemplateControl
            selected={this.state.id}
            templates={this.props.templates}
            onChange={this.handleTemplateChange}
            onDelete={this.handleTemplateDelete}
            onImport={this.props.onImport}/>
          <FormField
            id="template.name"
            name="name"
            value={this.state.name}
            isCompact
            tabIndex={-1}
            onChange={this.handleTemplateUpdate}/>
          <FormField
            id="template.id"
            name="id"
            value={this.state.id}
            isCompact
            tabIndex={-1}
            onChange={this.handleTemplateUpdate}/>
          <FormSelect
            id="template.type"
            name="type"
            value={this.state.type}
            options={this.props.types}
            tabIndex={-1}
            onChange={this.handleTemplateUpdate}/>
          {this.isPristine &&
            <FormGroup>
              <div className="col-12 text-right">
                <button
                  className="btn btn-primary min-width"
                  disabled={!this.isValid}
                  tabIndex={-1}
                  onClick={this.handleTemplateCreate}>
                  <FormattedMessage id="prefs.template.create"/>
                </button>
              </div>
            </FormGroup>}
        </header>

        <ul className="template-field-list">
          {this.state.fields.map((field) =>
            <TemplateField
              key={field.property.id}
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
      id: string.isRequired
    })).isRequired,
    templates: arrayOf(shape({
      id: string.isRequired,
      name: string
    })).isRequired,
    types: arrayOf(string).isRequired,
    onCreate: func.isRequired,
    onDelete: func.isRequired,
    onImport: func.isRequired,
    onSave: func.isRequired
  }

  static defaultProps = {
    types: ['item', 'photo']
  }
}

module.exports = {
  TemplateEditor
}
