import React from 'react'
import { PhotoIterable } from './iterable'
import { createClickHandler } from '../util'
import cx from 'classnames'
import { IconSelectionOverlay, IconWarningOverlay } from '../icons'
import { Button } from '../button'


class PhotoTile extends PhotoIterable {
  get classes() {
    return [...super.classes, 'tile', {
      active: this.props.isSelected
    }]
  }

  handleClick = createClickHandler({
    onClick: this.select,
    onDoubleClick: () => {
      this.props.onItemOpen(this.props.photo)
    }
  })

  handleExpansionToggle = (event) => {
    event?.stopPropagation()

    if (this.props.isExpanded) {
      this.props.onContract(this.props.photo)
    } else {
      this.props.onExpand(this.props.photo)
    }
  }

  render() {
    return this.connect(
      <li
        className={cx(this.classes)}
        ref={this.setContainer}>
        <div className="tile-state">
          {this.renderThumbnail({
            onClick: this.handleClick,
            onContextMenu: this.handleContextMenu
          })}
          {this.props.photo.broken &&
            <Button
              icon={<IconWarningOverlay/>}
              title="photo.consolidate"
              onClick={this.handleConsolidate}/>}
          {this.props.isExpandable &&
            <Button
              icon={<IconSelectionOverlay/>}
              onClick={this.handleExpansionToggle}/>}
        </div>
        {this.props.isExpanded && <div className="pointer"/>}
      </li>
    )
  }

  static defaultProps = {
    ...PhotoIterable.defaultProps,
    size: 512
  }
}


const PhotoTileContainer = PhotoTile.wrap()

export {
  PhotoTileContainer as PhotoTile
}
