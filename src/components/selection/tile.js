import React from 'react'
import { SelectionIterable } from './iterable'
import cx from 'classnames'
import { createClickHandler } from '../util'


class SelectionTile extends SelectionIterable {
  get classes() {
    return {
      ...super.classes,
      tile: true
    }
  }

  handleClick = createClickHandler({
    onClick: this.select,
    onDoubleClick: this.open
  })


  render() {
    return this.connect(
      <li
        className={cx(this.classes)}
        ref={this.container}
        onContextMenu={this.handleContextMenu}
        onClick={this.handleClick}>
        <div className="tile-state">
          {this.renderThumbnail()}
        </div>
      </li>
    )
  }

  static defaultProps = {
    ...SelectionIterable.defaultProps,
    size: 512
  }
}

const SelectionTileContainer = SelectionTile.withDragAndDrop()

export {
  SelectionTileContainer as SelectionTile
}
