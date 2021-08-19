import React from 'react'
import { ItemIterator } from './iterator'
import { ItemTile } from './tile'
import { Scroll } from '../scroll'
import cx from 'classnames'
import { SASS } from '../../constants'


export class ItemGrid extends ItemIterator {

  renderItemTile = (item, index) => (
    <ItemTile
      {...this.getIterableProps(item, index)}
      key={item.id}
      item={item}
      isLast={index >= this.props.items.length - 1}/>
  )

  render() {
    let tileSize = Math.round(this.props.size * SASS.TILE.FACTOR)

    return this.connect(
      <div
        className={cx('item-grid', {
          'drop-target': !this.props.isReadOnly,
          'over': this.props.isOver
        })}
        data-size={this.props.size}>
        <Scroll
          ref={this.container}
          autoselect
          cursor={this.indexOf(this.head())}
          items={this.props.items}
          itemHeight={tileSize}
          itemWidth={tileSize}
          tabIndex={this.tabIndex}
          onClick={this.handleClickOutside}
          onKeyDown={this.handleKeyDown}
          onSelect={this.handleSelectItem}>
          {this.renderItemTile}
        </Scroll>
      </div>
    )
  }

  static propTypes = {
    ...ItemIterator.propTypes
  }
}
