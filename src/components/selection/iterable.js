'use strict'

const React = require('react')
const { PureComponent } = React
const { Thumbnail } = require('../photo/thumbnail')
const { bool, func, number, shape, string } = require('prop-types')


class SelectionIterable extends PureComponent {

  componentDidUpdate(props) {
    if (this.props.isSelected && !props.isSelected) {
      this.container.scrollIntoViewIfNeeded()
    }
  }

  get classes() {
    return {
      selection: true,
      active: this.props.isSelected,
      last: this.props.isLast
    }
  }

  setContainer = (container) => {
    this.container = container
  }

  renderThumbnail(props) {
    return (
      <Thumbnail {...props}
        id={this.props.photo.id}
        angle={this.props.selection.angle}
        mirror={this.props.selection.mirror}
        orientation={this.props.photo.orientation}
        cache={this.props.cache}
        size={this.props.size}/>
    )
  }

  static propTypes = {
    isDisabled: bool.isRequired,
    isSelected: bool.isRequired,
    isLast: bool.isRequired,
    cache: string.isRequired,
    photo: shape({
      id: number.isRequired,
      orientation: number.isRequired
    }).isRequired,
    selection: shape({
      id: number.isRequired,
      angle: number,
      mirror: bool,
    }).isRequired,
    size: number.isRequired,
    onSelect: func.isRequired
  }

  static defaultProps = {
    size: 48
  }
}

module.exports = {
  SelectionIterable
}
