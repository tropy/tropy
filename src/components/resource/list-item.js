import React from 'react'
import { FormField, FormLink, FormText } from '../form'
import { func, object } from 'prop-types'


export class ResourceListItem extends React.PureComponent {
  handleChange = (data) => {
    this.props.onSave({ id: this.props.resource.id, ...data })
  }

  render() {
    const { resource, onOpenLink } = this.props

    return (
      <li className="resource">
        <fieldset>
          <FormField
            id="resource.label"
            name="label"
            value={resource.label}
            isCompact
            size={8}
            tabIndex={null}
            isRequired
            onChange={this.handleChange}/>
          <FormLink
            id="resource.id"
            isCompact
            size={8}
            value={resource.id}
            onClick={onOpenLink}/>
          <FormText
            id="resource.comment"
            isCompact
            isOptional
            size={8}
            value={resource.comment}/>
          <FormText
            id="resource.description"
            isCompact
            isOptional
            size={8}
            value={resource.description}/>
        </fieldset>
      </li>
    )
  }

  static propTypes = {
    resource: object.isRequired,
    onOpenLink: func.isRequired,
    onSave: func.isRequired
  }
}
