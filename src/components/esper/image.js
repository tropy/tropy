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
  get isEmpty() {
    return this.props.photo == null
  }

  get isVisible() {
    return this.props.isVisible && !this.isEmpty
  }

  get isDisabled() {
    return this.props.isDisabled && !this.isEmpty
  }

  get src() {
    const { photo } = this.props
    return photo && photo.protocol && photo.path && `${photo.protocol}://${photo.path}`
  }

  setStage = (stage) => {
    this.stage = stage
  }

  resize = () => {
    this.stage.handleResize()
  }

  render() {
    const { isDisabled, isVisible, src } = this

    return (
      <section className="esper">
        <EsperHeader>
          <EsperToolbar/>
        </EsperHeader>
        <EsperStage
          ref={this.setStage}
          isDisabled={isDisabled}
          isVisible={isVisible}
          src={src}/>
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
