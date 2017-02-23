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
            this.handleSelect(this.getPrevPhoto(this.state.cols))
            break

          case (this.isVertical ? 'ArrowRight' : 'ArrowDown'):
            this.handleSelect(this.getNextPhoto(this.state.cols))
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
      'photo-grid': true,
      'click-catcher': true
    }
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
