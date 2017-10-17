'use strict'

const React = require('react')
const { PureComponent } = React
const { MetadataField } = require('./field')
const { get } = require('../../common/util')
const { isArray } = Array
const { arrayOf, bool, func, object, shape, string } =  require('prop-types')


class MetadataList extends PureComponent {
  constructor(props) {
    super(props)
    this.key = this.getEditKey(props)
  }

  componentWillReceiveProps(props) {
    if (props.fields !== this.props.fields) {
      this.key = this.getEditKey(props)
    }
  }

  get isEmpty() {
    return this.props.fields.length === 0
  }

  indexOf(id) {
    const { fields } = this.props
    return (fields.idx != null) ?
      fields.idx[id] :
      fields.findIndex(f => f.property.id === id)
  }

  next(offset = 1) {
    const { fields } = this.props
    if (!fields.length) return null

    if (this.head == null) return fields[0]

    const idx = this.indexOf(this.head) + offset
    return (idx >= 0 && idx < fields.length) ? fields[idx] : null
  }

  prev(offset = 1) {
    return this.next(-offset)
  }

  current() {
    return this.next(0)
  }

  isEditing(property) {
    if (get(this.props.edit, [property]) === this.key) {
      this.head = property
      return true
    } else {
      return false
    }
  }

  getEditKey({ fields } = this.props) {
    return (fields != null) ? (isArray(fields.id) ? 'bulk' : fields.id) : null
  }

  edit = (property) => {
    this.props.onEdit({ field: { [property]: this.key } })
  }

  handleChange = (data, hasChanged) => {
    if (hasChanged || this.key === 'bulk') {
      this.props.onChange({ id: this.props.fields.id, data })
    } else {
      this.props.onEditCancel()
    }
  }

  handleNext = () => {
    const next = this.next()
    if (next != null) this.edit(next.property.id)
  }

  handlePrev = () => {
    const prev = this.prev()
    if (prev != null) this.edit(prev.property.id)
  }

  render() {
    this.head = null

    return (
      <ol className="metadata-fields">
        {this.props.fields.map(({ property, value, type, ...props }) =>
          <MetadataField {...props}
            key={property.id}
            isDisabled={this.props.isDisabled}
            isEditing={this.isEditing(property.id)}
            isMixed={!!value.mixed}
            property={property}
            text={value.text}
            type={value.type || type}
            onChange={this.handleChange}
            onEdit={this.edit}
            onEditCancel={this.props.onEditCancel}
            onNext={this.handleNext}
            onPrev={this.handlePrev}/>
        )}
      </ol>
    )
  }

  static propTypes = {
    isDisabled: bool,
    edit: object,
    fields: arrayOf(shape({
      isExtra: bool.isRequired,
      isRequired: bool,
      label: string,
      property: object.isRequired,
      value: object
    })).isRequired,
    onEdit: func,
    onEditCancel: func,
    onChange: func.isRequired
  }
}


module.exports = {
  MetadataList
}
