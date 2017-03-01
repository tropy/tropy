'use strict'

const React = require('react')
const { PureComponent, PropTypes, Children } = React
const { only } = require('./util')
const { Resizable } = require('./resizable')
const cx = require('classnames')
const { func, node, arrayOf, number } = PropTypes
const { PANEL } = require('../constants/style')


class Panel extends PureComponent {
  get classes() {
    return { 'panel-body': true }
  }

  renderHeader(header, props) {
    return (
      <header className="panel-header" {...props}>
        {header}
      </header>
    )
  }

  renderBody(body, props) {
    return (
      <div {...props} className={cx(this.classes)}>
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
    children: node
  }
}


class PanelGroup extends PureComponent {
  render() {
    const { header, children, height, onResize } = this.props

    const panels = Children.toArray(children)
    const last = panels.pop()

    return (
      <div id="panel-group">
        <header className="panel-group-header">
          {header}
        </header>
        <div className="panel-group-body">
          {panels.map((panel, idx) => (
            <Resizable
              key={idx}
              isRelative
              edge="bottom"
              value={height[idx]}
              min={PANEL.MIN}
              onChange={onResize}>
              {panel}
            </Resizable>
          ))}
          {last}
        </div>
      </div>
    )
  }

  static propTypes = {
    header: node,
    height: arrayOf(number),
    children: only(Panel),
    onResize: func.isRequired
  }
}

module.exports = {
  Panel,
  PanelGroup
}
