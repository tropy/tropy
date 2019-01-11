'use strict'

const React = require('react')
const { IconPhoto } = require('../icons')
const { Cache } = require('../../common/cache')
const { bool, func, number, string } = require('prop-types')
const { ICON } = require('../../constants/sass')
const { Rotation } = require('../../common/iiif')


class Thumbnail extends React.Component {
  state = {
    src: null,
    rot: '0',
    hasBeenFixed: false,
    hasFinishedLoading: false,
    isBroken: false
  }

  static getDerivedStateFromProps(props, state) {
    let src = Thumbnail.getUrl(props)
    let rot = Thumbnail.getRotation(props)
    let isBroken = props.broken

    let hasImageChanged = src !== state.src

    let hasBeenFixed =
      !hasImageChanged && (!isBroken && state.isBroken)

    let hasFinishedLoading = (src != null) &&
      (!(hasImageChanged || hasBeenFixed) || state.hasFinishedLoading)

    return {
      src, rot, hasBeenFixed, hasFinishedLoading, isBroken
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
      .format('x')
  }

  get hasFallbackIcon() {
    return this.state.isBroken || !this.state.hasFinishedLoading
  }

  get src() {
    return this.state.hasBeenFixed ?
      `${this.state.src}?fixed=true` : this.state.src
  }

  handleLoad = () => {
    this.setState({ hasFinishedLoading: true })
  }

  handleError = () => {
    if (this.props.onError != null && !this.state.isBroken) {
      this.props.onError(this.props.id)
    }
  }

  renderImage() {
  }

  render() {
    return (
      <figure
        className="thumbnail"
        onClick={this.props.onClick}
        onContextMenu={this.props.onContextMenu}
        onDoubleClick={this.props.onDoubleClick}
        onMouseDown={this.props.onMouseDown}>
        {this.hasFallbackIcon && <IconPhoto/>}
        {this.state.src &&
          <img
            className={`iiif rot-${this.state.rotation}`}
            src={this.src}
            onLoad={this.handleLoad}
            onError={this.handleError}/>}
      </figure>
    )
  }

  static propTypes = {
    angle: number,
    broken: bool,
    cache: string.isRequired,
    id: number,
    mimetype: string,
    mirror: bool,
    orientation: number,
    size: number.isRequired,
    onClick: func,
    onContextMenu: func,
    onDoubleClick: func,
    onError: func,
    onMouseDown: func
  }

  static defaultProps = {
    size: ICON.SIZE
  }
}


module.exports = {
  Thumbnail
}
