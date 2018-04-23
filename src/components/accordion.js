'use strict'

const React = require('react')
const { PureComponent, Children, cloneElement: clone } = React
const { only } = require('./util')
const cx = require('classnames')
const { bool, func, node, number, string } = require('prop-types')


class Accordion extends PureComponent {
  get classes() {
    return ['panel', {
      closed: !this.props.isOpen
    }]
  }

  close = () => {
    if (this.props.isOpen) {
      this.props.onToggle(this, false)
    }
  }

  handleToggle = () => {
    this.props.onToggle(this, !this.props.isOpen)
  }

  open = () => {
    if (!this.props.isOpen) {
      this.props.onToggle(this, true)
    }
  }

  renderHeader(header) {
    return (
      <header
        className="panel-header"
        onClick={this.props.canToggle ? this.handleToggle : null}>
        {header}
      </header>
    )
  }

  renderBody(body) {
    return this.props.isOpen && (
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
    isOpen: bool,
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

  isOpen(id) {
    return this.state.open === id
  }

  handleToggle = (accordion, isOpen) => {
    this.setState({
      open: isOpen ? accordion.props.id : null
    })
  }

  render() {
    return (
      <div className={cx('panel-group', 'accordion', this.props.className)}>
        {Children.map(this.props.children, (acc, id) =>
          clone(acc, {
            id,
            isOpen: this.isOpen(id),
            onToggle: this.handleToggle
          }))}
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
