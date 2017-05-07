'use strict'

const React = require('react')
const { PureComponent, Children } = React
const { only } = require('./util')
const cx = require('classnames')
const { bool, func, node, number, string } = require('prop-types')


class Accordion extends PureComponent {
  get classes() {
    return {
      panel: true,
      closed: this.props.isClosed
    }
  }

  handleToggle = () => {
    this.props.onToggle(this, !this.props.isClosed)
  }

  renderHeader(header) {
    return (
      <header
        className="panel-header"
        onDoubleClick={this.props.canToggle ? this.handleToggle : null}>
        {header}
      </header>
    )
  }

  renderBody(body) {
    return !this.props.isClosed && (
      <div className="panel-body">{body}</div>
    )
  }

  render() {
    const [header, ...body] = Children.toArray(this.props.children)

    return (
      <section className={cx(this.classes, this.props.className)}>
        {this.renderHeader(header)}
        {this.renderBody(body)}
      </section>
    )
  }

  static propTypes = {
    canToggle: bool,
    children: node,
    className: string,
    id: number.isRequired,
    isClosed: bool,
    onToggle: func.isRequired
  }

  static defaultProps = {
    canToggle: true
  }
}


class AccordionGroup extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      open: null
    }
  }

  render() {
    return (
      <div className={cx('panel-group', this.props.className)}>
        {this.props.children}
      </div>
    )
  }

  static propTypes = {
    children: only(Accordion),
    className: string
  }
}

module.exports = {
  Accordion,
  AccordionGroup
}
