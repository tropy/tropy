import React from 'react'
import { ItemIterator } from './iterator'
import { ItemTile } from './tile'
import { Scroll } from '../scroll'
import { refine } from '../../common/util'
import cx from 'classnames'
import { match, isMeta } from '../../keymap'


export class ItemGrid extends ItemIterator {

  constructor(props) {
    super(props)

    refine(this, 'handleKeyDown', ([event]) => {
      if (event.isPropagationStopped()) return

      switch (match(this.props.keymap, event)) {
        case (this.isVertical ? 'left' : 'up'):
          this.select(this.prev(this.container.current.layout.columns), {
            isMeta: isMeta(event),
            isRange: event.shiftKey,
            scrollIntoView: true,
            throttle: true
          })
          break
        case (this.isVertical ? 'right' : 'down'):
          this.select(this.next(this.container.current.layout.columns), {
            isMeta: isMeta(event),
            isRange: event.shiftKey,
            scrollIntoView: true,
            throttle: true
          })
          break
        default:
          return
      }

      event.preventDefault()
      event.stopPropagation()
      event.nativeEvent.stopImmediatePropagation()
    })
  }

  get classes() {
    return {
      'item-grid': true,
      'drop-target': !this.props.isReadOnly,
      'over': this.props.isOver
    }
  }


  render() {
    if (this.props.isEmpty) return this.renderNoItems()

    return this.connect(
      <div
        className={cx(this.classes)}
        data-size={this.props.size}>
        <Scroll
          ref={this.container}
          items={this.props.items}
          itemHeight={this.getRowHeight()}
          itemWidth={this.getRowHeight()}
          tabIndex={this.tabIndex}
          onClick={this.handleClickOutside}
          onKeyDown={this.handleKeyDown}
          onTabFocus={this.handleFocus}>
          {(item) =>
            <ItemTile
              {...this.getIterableProps(item)}
              key={item.id}
              item={item}/>}
        </Scroll>
      </div>
    )
  }

  static propTypes = {
    ...ItemIterator.propTypes
  }
}
