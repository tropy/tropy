'use strict'

const React = require('react')
const shallow = require('react/lib/shallowCompare')
const { Component, PropTypes } = React
const { func, bool, object, number } = PropTypes

const { IconB, IconI, IconU, IconQ, IconLink, IconBulletList, IconNumberedList,
  IconSink, IconLift } = require('../icons')
const { IconButton } = require('../button')
const { EditorState } = require('prosemirror-state')
const { EditorView } = require('prosemirror-view')

const { schema } = require('./schema')
const plugins = require('./plugins')(schema)
const commands = require('./commands')(schema)

const { match } = require('../../keymap')


class Editor extends Component {
  componentDidMount() {
    this.view = new EditorView(this.container, {
      state: EditorState.create({
        schema,
        plugins
      }),
      handleKeyDown: this.handleKeyDown,
      ...this.getEditorProps()
    })
  }

  componentWillUnmount() {
    this.view.destroy()
    delete this.view
  }

  shouldComponentUpdate(props) {
    if (shallow(this, props)) {
      this.update(props)
    }

    return false
  }

  getEditorProps(props = this.props) {
    return {
      editable: () => !props.isDisabled,
      attributes: {
        tabIndex: props.tabIndex
      }
    }
  }

  setContainer = (container) => {
    this.container = container
  }

  handleKeyDown = (view, event) => {
    const action = match(this.props.keymap, event)

    if (commands[action]) {
      return commands[action](view.state, view.dispatch, view)
    }

    return false
  }

  update(props = this.props) {
    this.view.setProps(this.getEditorProps(props))
  }

  render() {
    return (
      <div className="editor">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="tool-group">
              <IconButton icon={<IconB/>}/>
              <IconButton icon={<IconI/>}/>
              <IconButton icon={<IconU/>}/>
              <IconButton icon={<IconQ/>}/>
            </div>
            <div className="tool-group">
              <IconButton icon={<IconBulletList/>}/>
              <IconButton icon={<IconNumberedList/>}/>
              <IconButton icon={<IconSink/>}/>
              <IconButton icon={<IconLift/>}/>
            </div>
            <div className="tool-group">
              <IconButton icon={<IconLink/>}/>
            </div>
          </div>
        </div>
        <div className="scroll-container">
          <div ref={this.setContainer}/>
        </div>
      </div>
    )
  }

  static propTypes = {
    isDisabled: bool,
    keymap: object.isRequired,
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
