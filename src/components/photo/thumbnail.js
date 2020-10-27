import React from 'react'
import { IconPhoto } from '../icons'
import { Cache } from '../../common/cache'
import { bool, func, number, string } from 'prop-types'
import { SASS } from '../../constants'
import { Rotation } from '../../common/iiif'

const variant = (size) =>
  size > SASS.ICON.SIZE ? SASS.ICON.MAX : SASS.ICON.SIZE

export class Thumbnail extends React.Component {
  state = {
    rotation: '0',
    src: null,
    style: null
  }

  static getDerivedStateFromProps(props) {
    let src = Cache.url(props.cache, variant(props.size), props)
    let rot = Rotation.fromExifOrientation(props.orientation).add(props)
    let [x, y] = rot.ratio(props)

    return {
      src,
      rotation: rot.format('x'),
      style: {
        '--x': x,
        '--y': y,
        'backgroundColor': props.color
      }
    }
  }

  handleError = () => {
    if (this.props.onError && !this.props.broken) {
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
        {!this.state.src ? <IconPhoto/> : (
          <div className={`rotation-container iiif rot-${this.state.rotation}`}>
            <img
              decoding="async"
              loading="lazy"
              src={this.state.src}
              onError={this.handleError}/>
          </div>)}
      </figure>
    )
  }

  static propTypes = {
    angle: number,
    broken: bool,
    cache: string.isRequired,
    color: string,
    consolidated: number,
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
    size: SASS.ICON.SIZE
  }

  static keys = Object.keys(this.propTypes)
}
