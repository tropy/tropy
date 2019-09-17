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
    mode: 'portrait',
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

    return {
      mode: rotation.mode(props),
      src,
      rotation: rotation.format('x'),
      consolidated,
      hasFinishedLoading,
      isBroken
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
        className={`thumbnail ${this.state.mode}`}
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
    consolidated: instanceOf(Date),
    id: number,
    mimetype: string,
    mirror: bool,
    orientation: number,
    size: number.isRequired,
    width: number,
    height: number,
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
