import React from 'react'
import { ItemIterator } from './iterator'
import { ItemTile } from './tile'
import { Runway, ScrollContainer, Viewport } from '../scroll'
import { refine } from '../../common/util'
import cx from 'classnames'
import { match, isMeta } from '../../keymap'


export class ItemGrid extends ItemIterator {
  get isGrid() { return true }

  constructor(props) {
    super(props)

    refine(this, 'handleKeyDown', ([event]) => {
      if (event.isPropagationStopped()) return

      switch (match(this.props.keymap, event)) {
        case (this.isVertical ? 'left' : 'up'):
          this.select(this.prev(this.state.cols), {
            isMeta: isMeta(event),
            isRange: event.shiftKey,
            scrollIntoView: true,
            throttle: true
          })
          break
        case (this.isVertical ? 'right' : 'down'):
          this.select(this.next(this.state.cols), {
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
      'over': this.props.isOver,
      [this.orientation]: true
    }
  }


  render() {
    if (this.props.isEmpty) return this.renderNoItems()

    const { cols, height } = this.state
    const { transform } = this

    return this.connect(
      <div
        className={cx(this.classes)}
        data-size={this.props.size}
        onClick={this.handleClickOutside}>
        <ScrollContainer
          className="click-catcher"
          ref={this.setContainer}
          tabIndex={this.tabIndex}
          onKeyDown={this.handleKeyDown}>
          <Runway height={height}>
            <Viewport
              className="click-catcher"
              columns={cols}
              transform={transform}>
              {this.mapIterableRange(({ item, ...props }) =>
                <ItemTile {...props} key={item.id} item={item}/>
              )}
            </Viewport>
          </Runway>
        </ScrollContainer>
      </div>
    )
  }

  static propTypes = {
    ...ItemIterator.propTypes
  }
}
