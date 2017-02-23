'use strict'

const React = require('react')
const { ItemIterator } = require('./iterator')
const { ItemTile } = require('./tile')
const { on, off } = require('../../dom')
const { refine } = require('../../common/util')
const cx = require('classnames')


class ItemGrid extends ItemIterator {
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

  componentDidMount() {
    super.componentDidMount()
    on(this.container, 'tab:focus', this.handleFocus)
  }

  componentWillUnmount() {
    super.componentWillUnmount()
    off(this.container, 'tab:focus', this.handleFocus)
  }

  get classes() {
    return {
      'item-grid': true,
      'click-catcher': true,
      'drop-target': !this.props.isDisabled,
      'over': this.props.isOver,
      [this.orientation]: true
    }
  }


  render() {
    return this.connect(
      <ul
        className={cx(this.classes)}
        tabIndex={this.tabIndex}
        onKeyDown={this.handleKeyDown}
        ref={this.setContainer}
        data-size={this.props.size}
        onClick={this.handleClickOutside}>
        {this.map(({ item, ...props }) =>
          <ItemTile {...props} key={item.id} item={item}/>
        )}

        {this.filler}
      </ul>
    )
  }

  static get isGrid() {
    return true
  }

  static propTypes = {
    ...ItemIterator.propTypes
  }
}


module.exports = {
  ItemGrid
}
