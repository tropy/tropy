'use strict'

const React = require('react')
const shallow = require('react/lib/shallowCompare')
const { Component, PropTypes } = React
const { func, bool, object, number } = PropTypes

const { EditorState } = require('prosemirror-state')
const { EditorView } = require('prosemirror-view')
const { schema } = require('prosemirror-schema-basic')


class Editor extends Component {
  componentDidMount() {
    this.pm = new EditorView(this.container, {
      state: EditorState.create({ schema }),
      editable: this.isEditable
    })

    this.update()
  }

  componentWillUnmount() {
    this.pm.destroy()
  }

  shouldComponentUpdate(props) {
    if (shallow(this, props)) {
      this.update(props)
    }

    return false
  }

  isEditable = () => {
    !this.props.isDisabled
  }

  setContainer = (container) => {
    this.container = container
  }

  update(props = this.props) {
    this.pm.dom.tabIndex = props.tabIndex
  }

  render() {
    return (
      <div ref={this.setContainer} className="editor"/>
    )
  }

  static propTypes = {
    isDisabled: bool,
    value: object,
    onChange: func,
    tabIndex: number
  }

  static defaultProps = {
    tabIndex: -1
  }
}

module.exports = {
  Editor
}
