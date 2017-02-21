'use strict'

const React = require('react')
const { ItemIterator } = require('./iterator')
const { ItemTile } = require('./tile')
const { Shapes } = require('../util')
const { bounds, on, off } = require('../../dom')
const { refine } = require('../../common/util')
const cx = require('classnames')
const { TILE } = require('../../constants/style')


class ItemGrid extends ItemIterator {
  constructor(props) {
    super(props)

    this.state = {
      colsize: 0
    }

    refine(this, 'handleKeyDown', ([event]) => {
      if (!event.isPropagationStopped()) {
        switch (event.key) {
          case (this.isVertical ? 'ArrowLeft' : 'ArrowUp'):
            this.select(this.getPrevItem(this.state.colsize))
            break

          case (this.isVertical ? 'ArrowRight' : 'ArrowDown'):
            this.select(this.getNextItem(this.state.colsize))
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
    on(this.container, 'tab:focus', this.handleFocus)
    on(window, 'resize', this.resize)
    this.resize()
  }

  componentWillUnmount() {
    off(this.container, 'tab:focus', this.handleFocus)
    off(window, 'resize', this.resize)
  }

  componentDidUpdate(props) {
    if (this.props.zoom !== props.zoom) {
      this.resize()
    }
  }

  get isVertical() {
    return this.state.colsize === 1
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

  get placeholder() {
    return <li className="placeholder tile click-catcher"/>
  }

  resize = () => {
    const { width } = bounds(this.container)

    this.setState({
      colsize: Math.floor(width / (this.size * TILE.FACTOR))
    })
  }


  render() {
    const tile = this.placeholder

    return this.connect(
      <ul
        className={cx(this.classes)}
        tabIndex={this.tabIndex}
        onKeyDown={this.handleKeyDown}
        ref={this.setContainer}
        data-size={this.size}
        onClick={this.handleClickOutside}>
        {this.map(({ item, ...props }) =>
          <ItemTile {...props} key={item.id} item={item}/>
        )}

        {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
        {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
        {tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}{tile}
      </ul>
    )
  }


  static propTypes = {
    ...ItemIterator.propTypes,
    zoom: Shapes.number(1, ItemIterator.ZOOM.length - 1)
  }
}


module.exports = {
  ItemGrid
}
