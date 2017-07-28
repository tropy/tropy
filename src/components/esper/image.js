'use strict'

const React = require('react')
const { PureComponent } = React
const { EsperStage } = require('./stage')
const { EsperToolbar } = require('./toolbar')
const { bool, node, object } = require('prop-types')

const EsperHeader = ({ children }) => (
  <header className="esper-header draggable">{children}</header>
)

EsperHeader.propTypes = {
  children: node
}


class EsperImage extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      angle: 0
    }
  }

  get isEmpty() {
    return this.props.photo == null || this.props.photo.pending
  }

  get isVisible() {
    return this.props.isVisible && !this.isEmpty
  }

  get isDisabled() {
    return this.props.isDisabled && !this.isEmpty
  }

  get src() {
    return this.isEmpty ?
      null :
      `${this.props.photo.protocol}://${this.props.photo.path}`
  }

  get width() {
    return (this.props.photo && this.props.photo.width) || 0
  }

  get height() {
    return (this.props.photo && this.props.photo.height) || 0
  }

  setStage = (stage) => {
    this.stage = stage
  }

  resize = () => {
    this.stage.handleResize()
  }

  handleRotate = (by) => {
    this.setState({
      angle: (360 + (this.state.angle + by)) % 360
    })
  }

  render() {
    return (
      <section className="esper">
        <EsperHeader>
          <EsperToolbar
            isDisabled={this.isDisabled}
            onRotate={this.handleRotate}/>
        </EsperHeader>
        <EsperStage
          ref={this.setStage}
          isDisabled={this.isDisabled}
          isVisible={this.isVisible}
          src={this.src}
          angle={this.state.angle}
          width={this.width}
          height={this.height}/>
      </section>
    )
  }

  static propTypes = {
    isDisabled: bool,
    isVisible: bool,
    photo: object
  }

  static defaultProps = {
    isVisible: false
  }
}

module.exports = {
  EsperImage
}
