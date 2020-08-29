import React from 'react'
import { ResourceListItem } from './list-item'
import { array, func } from 'prop-types'


export class ResourceList extends React.PureComponent {
  render() {
    return (
      <ul className="resource-list">
        {this.props.resources.map(resource =>
          <ResourceListItem
            key={resource.id}
            resource={resource}
            onOpenLink={this.props.onOpenLink}
            onSave={this.props.onSave}/>)}
      </ul>
    )
  }

  static propTypes = {
    resources: array.isRequired,
    onOpenLink: func.isRequired,
    onSave: func.isRequired
  }
}
