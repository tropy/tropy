'use strict'

const React = require('react')
const { PureComponent } = React
const { Thumbnail } = require('../photo/thumbnail')
const { bool, func, number, shape, string } = require('prop-types')


class SelectionIterable extends PureComponent {
  componentDidUpdate({ isActive }) {
    if (this.props.isActive && !isActive) {
      this.container.scrollIntoViewIfNeeded()
    }
  }

  get classes() {
    return {
      selection: true,
      active: this.props.isActive,
      last: this.props.isLast
    }
  }

  setContainer = (container) => {
    this.container = container
  }

  select = () => {
    if (!this.props.isActive) {
      this.props.onSelect({
        id: this.props.photo.id,
        item: this.props.photo.item,
        selection: this.props.selection.id,
        notes: this.props.selection.notes
      })
    }
  }

  open = () => {
    this.props.onItemOpen({
      id: this.props.photo.id,
      item: this.props.photo.item,
      selection: this.props.selection.id
    })
  }

  handleContextMenu = (event) => {
    if (!this.props.isDisabled) {
      const { photo, selection } = this.props
      this.select()

      this.props.onContextMenu(event, 'selection', {
        id: photo.id,
        item: photo.item,
        path: photo.path,
        selection: selection.id
      })
    }
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
    isActive: bool.isRequired,
    isDisabled: bool.isRequired,
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
    onContextMenu: func.isRequired,
    onItemOpen: func.isRequired,
    onSelect: func.isRequired
  }

  static defaultProps = {
    size: 48
  }
}

module.exports = {
  SelectionIterable
}
