'use strict'

const React = require('react')
const PIXI = require('pixi.js')
const { PureComponent } = React
const { bool } = require('prop-types')
const { append, bounds, on, off } = require('../../dom')


class EsperStage extends PureComponent {
  componentDidMount() {
    const { width, height } = this.bounds
    this.pixi = new PIXI.Application({ width, height })
    append(this.pixi.view, this.container)
    on(window, 'resize', this.handleResize)
  }

  componentWillUnmount() {
    off(window, 'resize', this.handleResize)
    this.pixi.destroy(true)
  }


  shouldComponentUpdate(props) {
    if (props !== this.props) this.update(props)
    return false
  }

  setContainer = (container) => {
    this.container = container
  }

  handleResize = () => {
    const { width, height } = this.bounds
    this.pixi.renderer.resize(width, height)
  }

  get bounds() {
    return bounds(this.container)
  }

  update(props) {
    const { isDisabled } = props
    this.pixi[isDisabled ? 'stop' : 'start']()
  }

  render() {
    return (
      <div ref={this.setContainer} className="esper-stage"/>
    )
  }

  static propTypes = {
    isDisabled: bool
  }
}

module.exports = {
  EsperStage
}
