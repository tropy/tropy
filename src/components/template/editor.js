'use strict'

const React = require('react')
const { connect } = require('react-redux')
const { TemplateFieldList } = require('./field-list')
const { TemplateToolbar } = require('./toolbar')
const { FormattedMessage } = require('react-intl')
const { FormField, FormElement, FormSelect } = require('../form')
const { Template } = require('../../common/ontology')
const { arrayOf, func, shape, string, object } = require('prop-types')
const actions = require('../../actions')
const { TROPY, TYPE } = require('../../constants')
const { insert, move, remove } = require('../../common/util')

const {
  getDatatypeList,
  getTemplateList,
  getPropertyList,
  getClassList
} = require('../../selectors')


class TemplateEditor extends React.PureComponent {
  state = Template.make()

  componentDidUpdate(props) {
    if (props.templates !== this.props.templates) {
      let template = this.props.templates.find(t => t.id === this.state.id)
      if (template != null) {
        this.handleTemplateChange(template)
      }
    }
  }

  get isPristine() {
    return this.state.created == null
  }

  get isValid() {
    return this.state.id !== '' && this.state.name !== ''
  }

  handleTemplateCopy = () => {
    this.setState(Template.make({
      ...Template.copy(this.state, (field, idx) => ({
        id: -(idx + 1),
        ...Template.Field.copy(field)
      }))
    }))
  }

  handleTemplateDelete = () => {
    if (this.state.id) {
      this.props.onDelete([this.state.id])
      this.setState(Template.make())
    }
  }

  handleTemplateCreate = () => {
    let { id } = this.state
    this.props.onCreate({
      [id]: { id, ...Template.copy(this.state) }
    })
  }

  handleTemplateChange = (template) => {
    let state = Template.make(template || undefined)

    if (state.created && !state.isProtected && state.fields.length === 0) {
      state.fields.push(Template.Field.make())
    }

    this.setState(state)
  }

  handleTemplateUpdate = (template) => {
    let state = { domain: template.type, ...template }
    if (this.isPristine) {
      this.setState(state)
    } else {
      this.props.onSave({
        id: this.state.id, ...state
      })
    }
  }

  handleDomainUpdate = (rdfType) => {
    let domain = { domain: rdfType.domain.id }
    if (this.isPristine) {
      this.setState(domain)
    } else {
      this.props.onSave({
        id: this.state.id, ...domain
      })
    }
  }

  handleFieldSave = (id, data, idx) => {
    if (id < 0) {
      this.props.onFieldAdd({
        id: this.state.id,
        field: { datatype: TYPE.TEXT, ...data }
      }, { idx })
    } else {
      this.props.onFieldSave({
        id: this.state.id,
        field: { id, ...data }
      })
    }
  }

  handleFieldInsert = (field, at) => {
    this.setState({
      fields: insert(this.state.fields, at, Template.Field.make())
    })
  }

  handleFieldRemove = (field) => {
    if (field.id < 0) {
      this.setState({
        fields: remove(this.state.fields, field)
      })
    } else {
      this.props.onFieldRemove({
        id: this.state.id,
        field: field.id
      })
    }
  }

  handleSortStart = () => {
    this.__fields = this.state.fields
  }

  handleSort = (field) => {
    this.__fields = null

    if (field.id > 0) {
      this.props.onFieldOrder({
        id: this.state.id,
        fields: this.state.fields
          .map(f => f.id)
          .filter(id => id > 0)
      })
    }
  }

  handleSortPreview = (from, to, offset) => {
    this.setState({
      fields: move(this.state.fields, from, to, offset)
    })
  }

  handleSortReset = () => {
    this.setState({ fields: this.__fields })
    this.__fields = null
  }

  render() {
    let { isPristine } = this
    return (
      <div className="scroll-container">
        <div className="template-editor form-horizontal">
          <header className="template-header">
            <TemplateToolbar
              selected={isPristine ? null : this.state.id}
              templates={this.props.templates}
              isProtected={this.state.isProtected}
              isPristine={this.isPristine}
              onChange={this.handleTemplateChange}
              onCopy={this.handleTemplateCopy}
              onDelete={this.handleTemplateDelete}
              onExport={this.props.onExport}
              onImport={this.props.onImport}/>
            <FormField
              id="template.name"
              name="name"
              value={this.state.name}
              isCompact
              isRequired
              isDisabled={this.state.isProtected}
              tabIndex={0}
              onChange={isPristine ? undefined : this.handleTemplateUpdate}
              onInputChange={isPristine ?
                this.handleTemplateUpdate : undefined}
              size={9}/>
            <FormField
              id="template.id"
              name="id"
              value={this.state.id}
              isCompact
              isDisabled={this.state.isProtected || !isPristine}
              tabIndex={0}
              onInputChange={this.handleTemplateUpdate}
              size={9}/>
            <FormSelect
              id="template.type"
              name="type"
              value={this.state.type}
              options={this.props.types}
              tabIndex={0}
              isCompact
              isDisabled={this.state.isProtected || !isPristine}
              isRequired
              onChange={this.handleTemplateUpdate}
              size={9}/>
            <FormElement
              id="template.domain"
              isCompact
              size={9}>
              <ResourceSelect
                name="domain"
                value={this.state.domain}
                options={this.props.domains}
                tabIndex={0}
                isDisabled={this.state.isProtected || !isPristine}
                isRequired
                onChange={this.handleDomainUpdate}/>
            </FormElement>
            <FormField
              id="template.creator"
              name="creator"
              value={this.state.creator}
              isCompact
              isDisabled={this.state.isProtected}
              tabIndex={0}
              onChange={this.handleTemplateUpdate}
              size={9}/>
            <FormField
              id="template.description"
              name="description"
              value={this.state.description}
              isDisabled={this.state.isProtected}
              tabIndex={0} onChange={this.handleTemplateUpdate}
              size={9}/>
            {isPristine &&
              <FormElement className="flex-row justify-content-end">
                <button
                  className="btn btn-primary min-width"
                  disabled={!this.isValid}
                  tabIndex={0}
                  onClick={this.handleTemplateCreate}>
                  <FormattedMessage id="prefs.template.create"/>
                </button>
              </FormElement>}
          </header>
          <TemplateFieldList
            template={this.state.id}
            fields={this.state.fields}
            datatypes={this.props.datatypes}
            properties={this.props.properties}
            isDisabled={this.state.isProtected || isPristine}
            onInsert={this.handleFieldInsert}
            onRemove={this.handleFieldRemove}
            onSave={this.handleFieldSave}
            onSort={this.handleSort}
            onSortPreview={this.handleSortPreview}
            onSortReset={this.handleSortReset}
            onSortStart={this.handleSortStart}/>
        </div>
      </div>
    )
  }

  static propTypes = {
    datatypes: arrayOf(shape({
      id: string.isRequired
    })).isRequired,
    properties: arrayOf(shape({
      id: string.isRequired
    })).isRequired,
    templates: arrayOf(shape({
      id: string.isRequired,
      name: string
    })).isRequired,
    types: arrayOf(string).isRequired,
    domains: arrayOf(object).isRequired,
    onCreate: func.isRequired,
    onDelete: func.isRequired,
    onExport: func.isRequired,
    onFieldAdd: func.isRequired,
    onFieldOrder: func.isRequired,
    onFieldRemove: func.isRequired,
    onFieldSave: func.isRequired,
    onImport: func.isRequired,
    onSave: func.isRequired
  }

  static defaultProps = {
    types: [TROPY.Item, TROPY.Photo, TROPY.Selection],
    domains: []
  }
}


module.exports = {
  TemplateEditor: connect(
    state => ({
      properties: getPropertyList(state),
      templates: getTemplateList(state),
      datatypes: getDatatypeList(state),
      domains: getClassList(state)
    }),

    dispatch => ({
      onCreate(...args) {
        dispatch(actions.ontology.template.create(...args))
      },

      onDelete(...args) {
        dispatch(actions.ontology.template.delete(...args))
      },

      onExport(...args) {
        dispatch(actions.ontology.template.export(...args))
      },

      onFieldAdd(...args) {
        dispatch(actions.ontology.template.field.add(...args))
      },

      onFieldOrder(...args) {
        dispatch(actions.ontology.template.field.order(...args))
      },

      onFieldRemove(...args) {
        dispatch(actions.ontology.template.field.remove(...args))
      },

      onFieldSave(...args) {
        dispatch(actions.ontology.template.field.save(...args))
      },

      onImport() {
        dispatch(actions.ontology.template.import())
      },

      onSave(...args) {
        dispatch(actions.ontology.template.save(...args))
      }
    })
  )(TemplateEditor)
}
