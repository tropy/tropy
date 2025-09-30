import React from 'react'
import { PhotoIterable } from './iterable.js'
import { createClickHandler } from '../util.js'
import cx from 'classnames'
import { Icon } from '../icons.js'
import { TranscriptionIcon } from '../transcription/icon.js'
import { Button } from '../button.js'

class PhotoTile extends PhotoIterable {
  get classes() {
    return [...super.classes, 'tile', {
      active: this.props.isSelected,
      last: this.props.isLast
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
        ref={this.container}>
        <div className="tile-state">
          {this.renderThumbnail({
            onClick: this.handleClick,
            onContextMenu: this.handleContextMenu
          })}
          {this.props.photo.broken && (
            <Button
              icon={<Icon name="WarningOverlay"/>}
              className="warning"
              title="photo.consolidate"
              onClick={this.handleConsolidate}/>
          )}
          <div className="icon-container">
            {this.props.isExpandable && (
              <Button
                icon={<Icon name="SelectionOverlay"/>}
                onClick={this.handleExpansionToggle}/>
            )}
            <TranscriptionIcon
              id={this.props.photo.transcriptions?.at(-1)}
              overlay/>
          </div>
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
