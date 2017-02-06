'use strict'

const React = require('react')
const { Component, PropTypes, Children } = React
const { only } = require('./util')
const { Resizable } = require('./resizable')

class Panel extends Component {

  renderHeader(header, props) {
    return (
      <header className="panel-header" {...props}>
        {header}
      </header>
    )
  }

  renderBody(body, props) {
    return (
      <div className="panel-body" {...props}>
        {body}
      </div>
    )
  }

  render() {
    const [header, ...body] = Children.toArray(this.props.children)

    return (
      <section className="panel">
        {this.renderHeader(header)}
        {this.renderBody(body)}
      </section>
    )
  }

  static propTypes = {
    children: PropTypes.node
  }
}


const PanelGroup = ({ header, children, height }) => {
  const panels = Children.toArray(children)
  const last = panels.pop()

  return (
    <div id="panel-group">
      <header className="panel-group-header">
        {header}
      </header>
      <div className="panel-group-body">
        {panels.map((panel, idx) => (
          <Resizable key={idx} relative edge="bottom" value={height[idx]}>
            {panel}
          </Resizable>
        ))}
        {last}
      </div>
    </div>
  )
}

PanelGroup.propTypes = {
  header: PropTypes.node,
  height: PropTypes.arrayOf(PropTypes.number),
  children: only(Panel)
}

module.exports = {
  Panel,
  PanelGroup
}
