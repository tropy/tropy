'use strict'

const React = require('react')
const { PureComponent } = React
const { EsperStage } = require('./stage')
const { EsperToolbar } = require('./toolbar')
const { bool, node, object } = require('prop-types')

class Esper extends PureComponent {
  constructor(props) {
    super(props)
    this.state = this.getStateFromProps(props)
  }

  componentWillReceiveProps(props) {
    if (props !== this.props) {
      this.setState(this.getStateFromProps(props))
    }
  }

  getStateFromProps(props) {
    const { photo, isVisible, isDisabled } = props

    if (photo == null || photo.pending) {
      return {
        isDisabled: true,
        isVisible: false,
        src: null,
        width: 0,
        height: 0,
        angle: 0
      }
    }

    return {
      isDisabled,
      isVisible,
      src: `${photo.protocol}://${photo.path}`,
      width: photo.width,
      height: photo.height,
      angle: 0
    }
  }

  setStage = (stage) => {
    this.stage = stage
  }

  resize = () => {
    this.stage.resize()
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
            isDisabled={this.state.isDisabled}
            onRotate={this.handleRotate}/>
        </EsperHeader>
        <EsperStage
          ref={this.setStage}
          isDisabled={this.state.isDisabled}
          isVisible={this.state.isVisible}
          src={this.state.src}
          angle={this.state.angle}
          width={this.state.width}
          height={this.state.height}/>
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

const EsperHeader = ({ children }) => (
  <header className="esper-header draggable">{children}</header>
)

EsperHeader.propTypes = {
  children: node
}


module.exports = {
  EsperHeader,
  Esper
}
