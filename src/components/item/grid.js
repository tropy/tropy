'use strict'

const React = require('react')
const { ItemIterator } = require('./iterator')
const { ItemTile } = require('./tile')
const { refine } = require('../../common/util')
const cx = require('classnames')
const { match } = require('../../keymap')


class ItemGrid extends ItemIterator {
  get isGrid() { return true }

  constructor(props) {
    super(props)

    refine(this, 'handleKeyDown', ([event]) => {
      if (event.isPropagationStopped()) return

      switch (match(this.props.keymap, event)) {
        case (this.isVertical ? 'left' : 'up'):
          this.select(this.prev(this.state.cols), {
            isRange: event.shiftKey, throttle: true
          })
          break
        case (this.isVertical ? 'right' : 'down'):
          this.select(this.next(this.state.cols), {
            isRange: event.shiftKey, throttle: true
          })
          break
        default:
          return
      }

      event.preventDefault()
      event.stopPropagation()
    })
  }

  get classes() {
    return {
      'item': true,
      'grid': true,
      'drop-target': !this.props.isDisabled,
      'over': this.props.isOver,
      [this.orientation]: true
    }
  }


  render() {
    if (this.props.isEmpty) return this.renderNoItems()

    const { offset, height } = this.state
    const transform = `translate3d(0,${offset}px,0)`

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
            <ul className="viewport click-catcher" style={{ transform }}>
              {this.mapIterableRange(({ item, ...props }) =>
                <ItemTile {...props} key={item.id} item={item}/>
              )}
              {this.fillRow()}
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
