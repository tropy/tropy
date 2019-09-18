'use strict'

const React = require('react')
const { ItemIterator } = require('./iterator')
const { ItemTile } = require('./tile')
const { refine } = require('../../common/util')
const cx = require('classnames')
const { match, isMeta } = require('../../keymap')


class ItemGrid extends ItemIterator {
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
      'drop-target': !this.props.isDisabled,
      'over': this.props.isOver,
      [this.orientation]: true,
      'dragging': this.state.isDragging
    }
  }

  render() {
    if (this.props.isEmpty) return this.renderNoItems()

    const { cols, height } = this.state
    const { transform } = this
    const gridTemplateColumns = `repeat(${cols}, ${cols}fr)`

    return this.connect(
      <div
        className={cx(this.classes)}
        data-size={this.props.size}
        onClick={this.handleClickOutside}>
        <div
          className="scroll-container click-catcher"
          ref={this.setContainer}
          tabIndex={this.tabIndex}
          onKeyDown={this.handleKeyDown}>
          <div className="runway" style={{ height }}>
            <ul
              className="viewport click-catcher"
              style={{ gridTemplateColumns, transform }}>
              {this.mapIterableRange(({ item, ...props }) =>
                <ItemTile
                  {...props}
                  key={item.id}
                  item={item}
                  onDragStart={this.handleDragStart}
                  onDragStop={this.handleDragStop}/>
              )}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  static propTypes = {
    ...ItemIterator.propTypes
  }
}


module.exports = {
  ItemGrid
}
