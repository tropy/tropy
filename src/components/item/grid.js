'use strict'

const React = require('react')
const { ItemIterator } = require('./iterator')
const { ItemTile } = require('./tile')
const { refine } = require('../../common/util')
const cx = require('classnames')


class ItemGrid extends ItemIterator {
  get isGrid() { return true }

  constructor(props) {
    super(props)

    refine(this, 'handleKeyDown', ([event]) => {
      if (!event.isPropagationStopped()) {
        switch (event.key) {
          case (this.isVertical ? 'ArrowLeft' : 'ArrowUp'):
            this.select(this.getPrevItem(this.state.cols))
            break

          case (this.isVertical ? 'ArrowRight' : 'ArrowDown'):
            this.select(this.getNextItem(this.state.cols))
            break

          default:
            return
        }

        event.preventDefault()
        event.stopPropagation()
      }
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

    const { height } = this.state
    const offset = this.getOffset(true)
    const transform = `translate3d(0,${offset}px,0)`

    return this.connect(
      <div
        className={cx(this.classes)}
        tabIndex={this.tabIndex}
        onKeyDown={this.handleKeyDown}
        ref={this.setContainer}
        data-size={this.props.size}
        onClick={this.handleClickOutside}>
        <div
          ref={this.setScroller}
          className="scroll-container">
          <div className="runway click-catcher" style={{ height }}>
            <ul className="viewport" style={{ transform }}>
              {this.mapItemRange(({ item, ...props }) =>
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
