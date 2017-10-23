'use strict'

const React = require('react')
const { PhotoIterable } = require('./iterable')
const { createClickHandler } = require('../util')
const cx = require('classnames')
const { IconSelectionOverlay, IconWarningOverlay } = require('../icons')
const { IconButton } = require('../button')


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

  handleExpansionToggle= () => {
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
          <div className="icon-container">
            <IconWarningOverlay/>
            {this.props.isExpandable &&
              <IconButton
                icon={<IconSelectionOverlay/>}
                onClick={this.handleExpansionToggle}/>}
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


module.exports = {
  PhotoTile: PhotoTile.wrap()
}
