'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { func, bool, object, number } = PropTypes

const { EditorState } = require('prosemirror-state')
const { EditorView } = require('prosemirror-view')
const { schema } = require('prosemirror-schema-basic')


class Editor extends PureComponent {
  componentDidMount() {
    this.pm = new EditorView(this.container, {
      state: EditorState.create({ schema })
    })

    // TODO find out how to make ProseMirror do this
    this.pm.dom.tabIndex = this.props.tabIndex
  }

  componentWillUnmount() {
    this.pm.destroy()
  }

  setContainer = (container) => {
    this.container = container
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
