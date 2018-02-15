'use strict'

const React = require('react')
const { Component } = React
const { IconPhoto } = require('../icons')
const { imageURL } = require('../../common/cache')
const { pick } = require('../../common/util')
const { bool, func, number, string } = require('prop-types')
const { ICON } = require('../../constants/sass')
const { Rotation } = require('../../common/iiif')


class Thumbnail extends Component {
  constructor(props) {
    super(props)
    this.state = {
      src: this.getSource(props),
      rot: this.getRotation(props),
      hasBeenFixed: false,
      hasFinishedLoading: false
    }
  }

  componentWillReceiveProps(props) {
    const src = this.getSource(props)
    const rot = this.getRotation(props)

    const hasImageChanged = src !== this.state.src

    const hasBeenFixed =
      !hasImageChanged && (this.props.broken && !props.broken)

    const hasFinishedLoading =
      !(hasImageChanged || hasBeenFixed) || this.state.hasFinishedLoading

    this.setState({
      src, rot, hasBeenFixed, hasFinishedLoading
    })
  }

  getSource(props = this.props) {
    const { cache, id, mimetype, size } = props
    if (id == null) return null

    return (id == null) ?
      null :
      imageURL(cache, id, size > ICON.SIZE ? ICON.MAX : ICON.SIZE, mimetype)
  }

  getRotation(props = this.props) {
    return Rotation
      .fromExifOrientation(props.orientation)
      .add(props)
      .format('x')
  }

  get hasFallbackIcon() {
    return this.props.broken || !this.state.hasFinishedLoading
  }

  handleLoad = () => {
    this.setState({ hasFinishedLoading: true })
  }

  handleError = () => {
    if (this.props.onError != null) {
      this.props.onError(this.props.id)
    }
  }

  renderImage() {
    const { hasBeenFixed, rot, src } = this.state
    return src && (
      <img
        className={`iiif rot-${rot}`}
        src={hasBeenFixed ? `${src}?fixed=true` : src}
        onLoad={this.handleLoad}
        onError={this.handleError}/>
    )
  }

  render() {
    const listeners = pick(this.props, [
      'onClick', 'onDoubleClick', 'onMouseDown', 'onContextMenu'
    ])

    return (
      <figure {...listeners} className="thumbnail">
        {this.hasFallbackIcon && <IconPhoto/>}
        {this.renderImage()}
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
