import React from 'react'
import { NewMetadataField, MetadataField } from './field'
import { shallow } from '../../common/util'
import { arrayOf, bool, func, object, shape, string } from 'prop-types'


export class MetadataList extends React.PureComponent {
  get isBulk() {
    return this.props.fields.id.length > 1
  }

  get isEmpty() {
    return this.props.fields.length === 0
  }

  get hasNewMetadataField() {
    return this.props.onCreate != null &&
      this.props.edit != null &&
      this.props.edit.property == null &&
      shallow(this.props.edit.id, this.props.fields.id)
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
    try {
      var isEditing = this.props.edit != null &&
        property === this.props.edit.property &&
        shallow(this.props.fields.id, this.props.edit.id)
      return isEditing

    } finally {
      // Update head for keyboard navigation!
      if (isEditing) this.head = property
    }
  }

  edit = (property) => {
    this.props.onEdit({
      field: { id: this.props.fields.id, property }
    })
  }

  handleChange = (data, hasChanged, hasBeenForced) => {
    if (hasChanged || hasBeenForced && this.isBulk) {
      this.props.onChange({ id: this.props.fields.id, data })
    } else {
      this.props.onEditCancel()
    }
  }

  handleCreate = (property) => {
    this.props.onCreate({ id: this.props.fields.id, property })
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
            id={this.props.fields.id}
            isDisabled={this.props.isDisabled}
            isEditing={this.isEditing(property.id)}
            isMixed={!!value.mixed}
            property={property}
            text={value.text}
            type={value.type || type}
            completions={this.props.completions}
            onContextMenu={this.props.onContextMenu}
            onCopy={this.props.onCopy}
            onChange={this.handleChange}
            onEdit={this.edit}
            onEditCancel={this.props.onEditCancel}
            onNext={this.handleNext}
            onPrev={this.handlePrev}/>
        )}
        {this.hasNewMetadataField &&
          <NewMetadataField
            options={this.props.options}
            value={this.props.fields.map(f => f.property.id)}
            onCancel={this.props.onEditCancel}
            onCreate={this.handleCreate}/>}
      </ol>
    )
  }

  static propTypes = {
    completions: arrayOf(string).isRequired,
    isDisabled: bool,
    edit: object,
    fields: arrayOf(shape({
      isExtra: bool.isRequired,
      isRequired: bool,
      label: string,
      property: object.isRequired,
      value: object
    })).isRequired,
    options: arrayOf(object),
    onAfter: func.isRequired,
    onBefore: func.isRequired,
    onEdit: func,
    onEditCancel: func,
    onContextMenu: func,
    onCopy: func.isRequired,
    onChange: func.isRequired,
    onCreate: func
  }

  static defaultProps = {
    completions: []
  }
}
