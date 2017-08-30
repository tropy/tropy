'use strict'

const React = require('react')
const { PureComponent } = React
const { ResourceListItem } = require('./list-item')
const { array, func } = require('prop-types')


class ResourceList extends PureComponent {
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

module.exports = {
  ResourceList
}
