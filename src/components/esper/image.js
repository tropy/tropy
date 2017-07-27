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
  get src() {
    const { photo } = this.props
    return photo && `${photo.protocol}://${photo.path}`
  }

  setStage = (stage) => {
    this.stage = stage
  }

  resize = () => {
    this.stage.handleResize()
  }

  render() {
    return (
      <section className="esper">
        <EsperHeader>
          <EsperToolbar/>
        </EsperHeader>
        <EsperStage
          ref={this.setStage}
          isDisabled={!this.props.isVisible}
          image={this.src}/>
      </section>
    )
  }

  static propTypes = {
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
