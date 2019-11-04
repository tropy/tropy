'use strict'

const React = require('react')
const { IconPhoto } = require('../icons')
const { Cache } = require('../../common/cache')
const { bool, func, instanceOf, number, string } = require('prop-types')
const { ICON } = require('../../constants/sass')
const { Rotation } = require('../../common/iiif')


class Thumbnail extends React.Component {
  state = {
    src: null,
    rotation: '0',
    consolidated: null,
    hasFinishedLoading: false,
    isBroken: false
  }

  static getDerivedStateFromProps(props, state) {
    let src = Thumbnail.getUrl(props)
    let rotation = Thumbnail.getRotation(props)
    let isBroken = props.broken
    let consolidated = props.consolidated

    let hasImageChanged = src !== state.src ||
      consolidated > state.consolidated

    let hasFinishedLoading = (src != null) &&
      (!(hasImageChanged || isBroken) || state.hasFinishedLoading)

    let [x, y] = rotation.ratio(props)

    return {
      src,
      rotation: rotation.format('x'),
      consolidated,
      hasFinishedLoading,
      isBroken,
      style: { '--x': x, '--y': y, 'backgroundColor': props.color }
    }
  }

  static getUrl({ cache, id, mimetype, size }) {
    return (id == null) ?
      null :
      Cache.url(cache, id, size > ICON.SIZE ? ICON.MAX : ICON.SIZE, mimetype)
  }

  static getRotation({ orientation, angle, mirror }) {
    return Rotation
      .fromExifOrientation(orientation)
      .add({ angle, mirror })
  }

  get hasFallbackIcon() {
    return this.state.isBroken || !this.state.hasFinishedLoading
  }

  get src() {
    return (this.state.consolidated == null) ?
      this.state.src :
      `${this.state.src}?c=${this.state.consolidated.getTime()}`
  }

  handleLoad = () => {
    this.setState({ hasFinishedLoading: true })
  }

  handleError = () => {
    if (this.props.onError != null && !this.state.isBroken) {
      this.props.onError(this.props.id)
    }
  }

  render() {
    return (
      <figure
        className="thumbnail"
        style={this.state.style}
        onClick={this.props.onClick}
        onContextMenu={this.props.onContextMenu}
        onDoubleClick={this.props.onDoubleClick}
        onMouseDown={this.props.onMouseDown}>
        {this.hasFallbackIcon && <IconPhoto/>}
        {this.state.src &&
          <div className={`rotation-container iiif rot-${this.state.rotation}`}>
            <img
              decoding="async"
              loading="lazy"
              src={this.src}
              onLoad={this.handleLoad}
              onError={this.handleError}/>
          </div>}
      </figure>
    )
  }

  static propTypes = {
    angle: number,
    broken: bool,
    cache: string.isRequired,
    color: string,
    consolidated: instanceOf(Date),
    height: number,
    id: number,
    mimetype: string,
    mirror: bool,
    orientation: number,
    size: number.isRequired,
    width: number,
    onClick: func,
    onContextMenu: func,
    onDoubleClick: func,
    onError: func,
    onMouseDown: func
  }

  static defaultProps = {
    size: ICON.SIZE
  }

  static keys = Object.keys(this.propTypes)
}

module.exports = {
  Thumbnail
}
