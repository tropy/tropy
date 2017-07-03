'use strict'

const React = require('react')
const { PureComponent } = React
const { TemplateSelect } = require('./select')
const { TemplateFieldList } = require('./field-list')
const { ButtonGroup, IconButton } = require('../button')
const { FormattedMessage } = require('react-intl')
const { FormField, FormGroup, FormSelect, Label } = require('../form')
const { pick } = require('../../common/util')
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
          <IconButton
            isDisabled={!props.selected}
            icon={<IconNew/>}/>
          <IconButton
            isDisabled={!props.selected}
            icon={<IconCopy/>}/>
          <IconButton
            icon={<IconTrash/>}
            isDisabled={!props.selected}
            onClick={props.onDelete}/>
          <IconButton icon={<IconImport/>}
            onClick={props.onImport}/>
          <IconButton
            isDisabled={!props.selected}
            icon={<IconExport/>}/>
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
  template = template || {
    name: '',
    id: '',
    type: 'item',
    creator: '',
    description: '',
    created: null,
    isProtected: null,
    fields: []
  }

  return { ...template }
}

class TemplateEditor extends PureComponent {
  constructor(props) {
    super(props)
    this.state = dup()
  }

  componentWillReceiveProps({ templates }) {
    if (this.state.id != null && this.props.templates !== templates) {
      this.setState(dup(templates.find(t => t.id === this.state.id)))
    }
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
      [this.state.id]: pick(this.state, [
        'id', 'name', 'type', 'creator', 'description'
      ])
    })
  }

  handleTemplateChange = (template) => {
    this.setState(dup(template))
  }

  handleTemplateUpdate = (template) => {
    if (this.isPristine) {
      this.setState(template)

    } else {
      this.props.onSave({
        id: this.state.id, ...template
      })
    }
  }

  render() {
    const { isPristine } = this

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
            isRequired
            tabIndex={0}
            onChange={this.handleTemplateUpdate}/>
          <FormField
            id="template.id"
            name="id"
            value={this.state.id}
            isCompact
            isDisabled={!isPristine}
            tabIndex={0}
            onChange={this.handleTemplateUpdate}/>
          <FormSelect
            id="template.type"
            name="type"
            value={this.state.type}
            options={this.props.types}
            tabIndex={0}
            isCompact
            isDisabled={!isPristine}
            onChange={this.handleTemplateUpdate}/>
          <FormField
            id="template.creator"
            name="creator"
            value={this.state.creator}
            isCompact
            tabIndex={0}
            onChange={this.handleTemplateUpdate}/>
          <FormField
            id="template.description"
            name="description"
            value={this.state.description}
            tabIndex={0}
            onChange={this.handleTemplateUpdate}/>
          {isPristine &&
            <FormGroup>
              <div className="col-12 text-right">
                <button
                  className="btn btn-primary min-width"
                  disabled={!this.isValid}
                  tabIndex={0}
                  onClick={this.handleTemplateCreate}>
                  <FormattedMessage id="prefs.template.create"/>
                </button>
              </div>
            </FormGroup>}
        </header>
        <TemplateFieldList
          fields={this.state.fields}
          properties={this.props.properties}/>
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
