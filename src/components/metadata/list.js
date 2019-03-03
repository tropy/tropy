'use strict'

const React = require('react')
const { MetadataField } = require('./field')
const { get } = require('../../common/util')
const { arrayOf, bool, func, object, shape, string } =  require('prop-types')


class MetadataList extends React.PureComponent {
  get isBulk() {
    return this.props.fields.key === 'bulk'
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

  first() {
    return this.props.fields[0]
  }

  last() {
    return this.props.fields[this.props.fields.length - 1]
  }

  next(offset = 1) {
    const { fields } = this.props
    if (!fields.length) return null

    if (this.head == null) {
      return (offset < 0) ? this.last() : this.first()
    }

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
    let { key } = this.props.fields
    if (key != null && key === get(this.props.edit, [property])) {
      this.head = property
      return true
    } else {
      return false
    }
  }

  edit = (property) => {
    this.props.onEdit({ field: { [property]: this.props.fields.key } })
  }

  handleChange = (data, hasChanged) => {
    if (hasChanged || this.isBulk) {
      this.props.onChange({ id: this.props.fields.id, data })
    } else {
      this.props.onEditCancel()
    }
  }

  handleNext = () => {
    const next = this.next()
    if (next != null) this.edit(next.property.id)
    else this.props.onAfter()
  }

  handlePrev = () => {
    const prev = this.prev()
    if (prev != null) this.edit(prev.property.id)
    else this.props.onBefore()
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
            onContextMenu={this.props.onContextMenu}
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
    onAfter: func.isRequired,
    onBefore: func.isRequired,
    onEdit: func,
    onEditCancel: func,
    onContextMenu: func,
    onChange: func.isRequired
  }
}


module.exports = {
  MetadataList
}
