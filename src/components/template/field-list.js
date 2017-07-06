'use strict'

const React = require('react')
const { PureComponent } = React
const { TemplateField } = require('./field')
const { insert, move } = require('../../common/util')
const { arrayOf, bool, func, object, shape, string } = require('prop-types')


let tmpId = -1

const newField = () => ({
  id: tmpId--,
  property: '',
  isRequired: false
})


class TemplateFieldList extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      fields: this.getFields(props)
    }
  }

  componentWillReceiveProps(props) {
    if (props.fields !== this.props.fields) {
      this.setState({
        fields: this.getFields(props)
      })
    }
  }

  getFields(props) {
    const { isDisabled, fields, template } = props
    if (isDisabled || !template) return fields
    if (fields.length > 0) return [...fields]
    return [newField()]
  }

  get isEmpty() {
    return this.props.fields.length === 0
  }

  handleFieldSave = (field) => {
    if (field.id < 0) {
      this.props.onFieldAdd({
        id: this.props.template,
        field: field.id
      }, { idx: field.position })
    }
  }

  handleFieldInsert = (field, at) => {
    this.setState({
      fields: insert(this.state.fields, at, newField())
    })
  }

  handleFieldRemove = (field) => {
    this.props.onFieldRemove({
      id: this.props.template,
      field: field.id
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
    return this.props.template != null && (
      <ul className="template-field-list">
        {this.state.fields.map((field, idx) =>
          <TemplateField
            key={field.id}
            field={field}
            position={idx}
            properties={this.props.properties}
            isDisabled={this.props.isDisabled}
            isOnly={this.isEmpty}
            isTransient={field.id < 0}
            onInsert={this.handleFieldInsert}
            onRemove={this.handleFieldRemove}
            onSort={this.handleSort}
            onSortPreview={this.handleSortPreview}
            onSortReset={this.handleSortReset}/>)}
      </ul>
    )
  }

  static propTypes = {
    isDisabled: bool,
    template: string.isRequired,
    fields: arrayOf(object).isRequired,
    properties: arrayOf(shape({
      id: string.isRequired
    })).isRequired,
    onFieldAdd: func.isRequired,
    onFieldRemove: func.isRequired,
  }
}

module.exports = {
  TemplateFieldList
}
