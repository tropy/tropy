'use strict'

const React = require('react')
const { PhotoIterator } = require('./iterator')
const { PhotoTile } = require('./tile')
const { on, off } = require('../../dom')
const { refine } = require('../../common/util')
const cx = require('classnames')


class PhotoGrid extends PhotoIterator {
  constructor(props) {
    super(props)

    refine(this, 'handleKeyDown', ([event]) => {
      if (!event.isPropagationStopped()) {
        switch (event.key) {
          case (this.isVertical ? 'ArrowLeft' : 'ArrowUp'):
            this.select(this.getPrevPhoto(this.state.cols))
            break

          case (this.isVertical ? 'ArrowRight' : 'ArrowDown'):
            this.select(this.getNextPhoto(this.state.cols))
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
      ...super.classes,
      'photo': true,
      'grid': true,
      'click-catcher': true
    }
  }

  getNextRowOffset(index) {
    return index + (this.state.cols - (index % this.state.cols))
  }

  isExpanded(photo) {
    return !photo.pending &&
      this.props.expanded[0] === photo.id &&
      photo.selections.length > 0
  }

  map(fn) {
    this.idx = {}
    const { photos } = this.props
    const { size } = this
    let out = []
    let cur = 0
    let gap = size
    let exp

    for (; cur < gap && cur < size; ++cur) {
      let photo = photos[cur]
      this.idx[photo.id] = cur

      if (this.isExpanded(photo)) {
        exp = photo
        gap = this.getNextRowOffset(cur)
      }

      out.push(fn(this.getIterableProps(photo, cur)))
    }

    if (exp != null) {
      if (gap > size) {
        out = out.concat(this.fill(gap - size, 'gap'))
      }

      out.push(this.renderSelectionGrid(exp))
    }

    for (; cur < size; ++cur) {
      let photo = photos[cur]
      this.idx[photo.id] = cur
      out.push(fn(this.getIterableProps(photo, cur)))
    }

    return out
  }

  renderSelectionGrid(photo) {
    return (
      <li key="expansion" className="tile-expansion">
        {photo.id}
      </li>
    )
  }

  render() {
    return this.connect(
      <ul
        className={cx(this.classes)}
        ref={this.setContainer}
        tabIndex={this.tabIndex}
        data-size={this.props.size}
        onKeyDown={this.handleKeyDown}>
        {this.map(({ photo, ...props }) =>
          <PhotoTile {...props} key={photo.id} photo={photo}/>
        )}
        {this.filler}
      </ul>
    )
  }


  static propTypes = {
    ...PhotoIterator.propTypes
  }

  static get isGrid() {
    return true
  }
}

module.exports = {
  PhotoGrid: PhotoGrid.wrap()
}
