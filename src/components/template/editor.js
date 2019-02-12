'use strict'

const React = require('react')
const { connect } = require('react-redux')
const { TemplateFieldList } = require('./field-list')
const { TemplateToolbar } = require('./toolbar')
const { FormattedMessage } = require('react-intl')
const { FormField, FormGroup, FormSelect } = require('../form')
const { identify, pick } = require('../../common/util')
const { arrayOf, func, shape, string } = require('prop-types')
const actions = require('../../actions')
const { TYPE } = require('../../constants')

const {
  getDatatypeList,
  getTemplateList,
  getPropertyList
} = require('../../selectors')


class TemplateEditor extends React.PureComponent {
  state = newTemplate()

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
    this.setState(newTemplate({
      ...TEMPLATE,
      ...copyTemplate(this.state, (field, idx) => ({
        id: -(idx + 1),
        ...copyField(field)
      }))
    }))
  }

  handleTemplateDelete = () => {
    if (this.state.id) {
      this.props.onDelete([this.state.id])
      this.setState(newTemplate())
    }
  }

  handleTemplateCreate = () => {
    let { id } = this.state
    this.props.onCreate({
      [id]: { id, ...copyTemplate(this.state) }
    })
  }

  handleTemplateClear = () => {
    this.handleTemplateChange()
  }

  handleTemplateChange = (template) => {
    this.setState(newTemplate(template))
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
              onClear={this.handleTemplateClear}
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
            datatypes={this.props.datatypes}
            properties={this.props.properties}
            isDisabled={this.state.isProtected || isPristine}
            onFieldAdd={this.props.onFieldAdd}
            onFieldOrder={this.props.onFieldOrder}
            onFieldRemove={this.props.onFieldRemove}
            onFieldSave={this.props.onFieldSave}/>
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
    types: [TYPE.ITEM, TYPE.PHOTO, TYPE.SELECTION]
  }
}

const TEMPLATE = {
  name: '',
  type: TYPE.ITEM,
  creator: '',
  description: '',
  created: null,
  isProtected: false,
  fields: []
}

const defaultId = () =>
  `https://tropy.org/v1/templates/id#${identify()}`

const newTemplate = (template) => ({
  id: (template || TEMPLATE).id || defaultId(), ...(template || TEMPLATE)
})

const copyTemplate = (template, mapField = copyField) => ({
  name: template.name,
  type: template.type,
  creator: template.creator,
  description: template.description,
  fields: template.fields.map(mapField)
})

const copyField = (field) => pick(field, [
  'property',
  'label',
  'datatype',
  'isRequired',
  'hint',
  'constant'
])


module.exports = {
  TemplateEditor: connect(
    state => ({
      properties: getPropertyList(state),
      templates: getTemplateList(state),
      datatypes: getDatatypeList(state)
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
