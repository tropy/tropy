'use strict'

const React = require('react')
const { PhotoIterator } = require('./iterator')
const { PhotoTile } = require('./tile')
const { bounds, on, off } = require('../../dom')
const { refine, times } = require('../../common/util')
const cx = require('classnames')
const { TILE } = require('../../constants/style')


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

  componentWillReceiveProps(props) {
    if (this.props.size !== props.size) {
      this.resize()
    }
  }

  resize = () => {
    const { width } = bounds(this.container)

    this.setState({
      colsize: Math.floor(width / (this.props.size * TILE.FACTOR))
    })
  }

  get dangling() {
    return this.count % this.state.colsize
  }

  get classes() {
    return {
      ...super.classes,
      'photo-grid': true,
      'click-catcher': true
    }
  }

  get isVertical() {
    return this.state.colsize === 1
  }

  fill() {
    const { dangling } = this
    if (!dangling) return

    return times(this.state.colsize - dangling, (i) => (
      <li key={`filler-${i}`} className="filler tile click-catcher"/>
    ))
  }

  render() {
    return this.connect(
      <ul
        className={cx(this.classes)}
        ref={this.setContainer}
        tabIndex={this.tabIndex}
        data-size={this.props.size}
        onKeyDown={this.handleKeyDown}
        onClick={this.handleClickOutside}>
        {this.map(({ photo, ...props }) =>
          <PhotoTile {...props} key={photo.id} photo={photo}/>
        )}

        {this.fill()}
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
