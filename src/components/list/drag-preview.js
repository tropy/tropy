import React from 'react'
import { IconFolder } from '../icons'
import { number, shape, string } from 'prop-types'


export class ListDragPreview extends React.PureComponent {
  get style() {
    return {
      paddingLeft: this.props.list.padding
    }
  }

  render() {
    return (
      <div className="list drag-preview" style={this.style}>
        <div className="drag-preview-container">
          <IconFolder/>
          <div className="name">
            {this.props.list.name}
          </div>
        </div>
      </div>
    )
  }

  static propTypes = {
    list: shape({
      name: string.isRequired,
      padding: number.isRequired
    }).isRequired
  }
}
