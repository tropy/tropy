import React from 'react'
import { FormField, FormLink, FormText } from '../form.js'

export class ResourceListItem extends React.PureComponent {
  handleChange = (data) => {
    this.props.onSave({ id: this.props.resource.id, ...data })
  }

  render () {
    const { resource, onOpenLink } = this.props

    return (
      <li className="resource">
        <fieldset>
          <FormField
            id="resource.label"
            name="label"
            value={resource.label}
            isCompact
            tabIndex={null}
            isRequired
            onChange={this.handleChange}/>
          <FormLink
            id="resource.id"
            isCompact
            value={resource.id}
            onClick={onOpenLink}/>
          <FormText
            id="resource.comment"
            isCompact
            isOptional
            value={resource.comment}/>
          <FormText
            id="resource.description"
            isCompact
            isOptional
            value={resource.description}/>
        </fieldset>
      </li>
    )
  }
}
