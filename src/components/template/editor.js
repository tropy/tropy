'use strict'

const React = require('react')
const { PureComponent } = React
const { TemplateFieldList } = require('./field-list')
const { TemplateToolbar } = require('./toolbar')
const { FormattedMessage } = require('react-intl')
const { FormField, FormGroup, FormSelect } = require('../form')
const { pick } = require('../../common/util')
const { arrayOf, func, shape, string } = require('prop-types')


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
      <div className="scroll-container">
        <div className="template editor form-horizontal">
          <header className="template-header">
            <TemplateToolbar
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
              tabIndex={0} onChange={this.handleTemplateUpdate}/>
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
            template={this.state.id}
            fields={this.state.fields}
            properties={this.props.properties}
            onFieldAdd={this.props.onFieldAdd}
            onFieldRemove={this.props.onFieldRemove}/>
        </div>
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
    onFieldAdd: func.isRequired,
    onFieldRemove: func.isRequired,
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
