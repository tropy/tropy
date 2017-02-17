'use strict'

const React = require('react')
const { PhotoIterator } = require('./iterator')
const { PhotoTile } = require('./tile')
const { bounds, on, off } = require('../../dom')
const { refine } = require('../../common/util')
const cx = require('classnames')
const { TILE } = require('../../constants/style')

const SMALL = TILE.FACTOR * (1 - 1 / TILE.FACTOR)


class PhotoGrid extends PhotoIterator {
  constructor(props) {
    super(props)

    this.state = {
      colsize: 0
    }

    refine(this, 'handleKeyDown', ([event]) => {
      if (!event.isPropagationStopped()) {
        switch (event.key) {
          case (this.isVertical ? 'ArrowLeft' : 'ArrowUp'):
            this.handleSelect(this.getPrevPhoto(this.state.colsize))
            break

          case (this.isVertical ? 'ArrowRight' : 'ArrowDown'):
            this.handleSelect(this.getNextPhoto(this.state.colsize))
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

  resize = () => {
    const { width } = bounds(this.container)

    this.setState({
      colsize: Math.floor(width / (this.size * TILE.FACTOR))
    })
  }

  get classes() {
    return {
      ...super.classes,
      'photo-grid': true,
      'click-catcher': true
    }
  }

  get placeholder() {
    return (
      <li
        className="placeholder tile click-catcher"
        style={{ flexBasis: `${this.size * TILE.FACTOR}px` }}/>
    )
  }

  get isSmall() {
    return this.size * SMALL <= TILE.PADDING
  }

  get isVertical() {
    return this.state.colsize === 1
  }

  render() {
    const { isSmall } = this
    const tile = this.placeholder

    return this.connect(
      <ul
        className={cx(this.classes)}
        ref={this.setContainer}
        tabIndex={this.tabIndex}
        onKeyDown={this.handleKeyDown}
        onClick={this.handleClickOutside}>
        {this.map(({ photo, ...props }) =>
          <PhotoTile {...props} key={photo.id} photo={photo} isSmall={isSmall}/>
        )}

        {tile}{tile}{tile}{tile}{tile}{tile}{tile}
        {tile}{tile}{tile}{tile}{tile}{tile}{tile}
      </ul>
    )
  }


  static propTypes = {
    ...PhotoIterator.propTypes
  }
}

module.exports = {
  PhotoGrid: PhotoGrid.wrap()
}
