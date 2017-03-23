'use strict'

const React = require('react')
const PIXI = require('pixi.js')
const { PureComponent, PropTypes } = React
const { bool } = PropTypes
const { append } = require('../../dom')


class EsperStage extends PureComponent {
  componentDidMount() {
    this.pixi = new PIXI.Application()
    append(this.pixi.view, this.container)
  }

  componentWillUnmount() {
    this.pixi.destroy(true)
  }


  shouldComponentUpdate(props) {
    if (props !== this.props) this.update(props)
    return false
  }

  setContainer = (container) => {
    this.container = container
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
