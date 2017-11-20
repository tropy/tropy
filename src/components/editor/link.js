'use strict'

const React = require('react')
const { PureComponent } = require('react')
const { bool, func } = require('prop-types')
const { injectIntl, intlShape } = require('react-intl')
const { ToolbarContext, ToolbarLeft } = require('../toolbar')
const { Input } = require('../input')
const { ensure } = require('../../dom')


class LinkToolbar extends PureComponent {
  componentWillReceiveProps(props) {
    if (!this.props.isActive && props.isActive) {
      ensure(
        this.container,
        'transitionend',
        this.input.focus,
        850)
    }
  }

  getLabelFor(name) {
    return this.props.intl.formatMessage({
      id: `editor.commands.link.${name}`
    })
  }

  handleBlur = () => true // cancel on blur

  handleTargetChange = (href) => {
    this.props.onCommit({ href })
  }

  setContainer = (container) => {
    this.container = container
  }

  setInput = (input) => {
    this.input = input
  }

  render() {
    return (
      <ToolbarContext
        dom={this.setContainer}
        isActive={this.props.isActive}>
        <ToolbarLeft className="form-inline">
          <Input
            ref={this.setInput}
            className="form-control link-target"
            isDisabled={!this.props.isActive}
            isRequired
            placeholder={this.getLabelFor('target')}
            value=""
            onBlur={this.handleBlur}
            onCancel={this.props.onCancel}
            onCommit={this.handleTargetChange}/>
        </ToolbarLeft>
      </ToolbarContext>
    )
  }

  static propTypes = {
    isActive: bool.isRequired,
    onCancel: func.isRequired,
    onCommit: func.isRequired,
    intl: intlShape.isRequired
  }
}

function markExtend(selection, markType) {
  if (!selection) return
  const pos = selection.$cursor || selection.$anchor
  let startIndex = pos.index()
  let endIndex = pos.indexAfter()

  const hasMark = (index) => {
    // clicked outside edge of tag.
    if (index === pos.parent.childCount) {
      index--
    }
    const result = pos.parent.child(index).marks.filter(
      mark => mark.type.name === markType.name)
    return !!result.length
  }

  if (!hasMark(startIndex) && !hasMark(endIndex)) {
    return
  }
  while (startIndex > 0 && hasMark(startIndex)) {
    startIndex--
  }
  while ( endIndex < pos.parent.childCount && hasMark(endIndex)) {
    endIndex++
  }

  let startPos = pos.start()
  let endPos = startPos

  for (let i = 0; i < endIndex; i++) {
    let size = pos.parent.child(i).nodeSize
    if (i < startIndex) startPos += size
    endPos += size
  }

  return { from: startPos, to: endPos }
}

module.exports = {
  LinkToolbar: injectIntl(LinkToolbar),
  markExtend
}
