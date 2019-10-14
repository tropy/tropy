'use strict'

const React = require('react')
const { Item } = require('./item')
const { WindowContext } = require('../main')
const { noop } = require('../../common/util')
const { loadImage } = require('../../dom')
const { join } = require('path')


class PrintContainer extends React.Component {
  state = {
    items: []
  }

  componentDidMount() {
    this.context.on('print', this.onPrint)
  }

  componentWillUnmount() {
    this.context.removeListener('print', this.onPrint)
  }

  onPrint = (opts) => {
    this.setState({
      canOverflow: opts.overflow,
      hasMetadata: opts.metadata,
      hasNotes: opts.notes,
      items: opts.items,
      cache: join(ARGS.cache, opts.project)
    }, this.handleItemsReceived)
  }

  handleItemsReceived = async () => {
    let p = []

    for (let item of this.state.items) {
      for (let photo of item.photos) {
        p.push(loadImage(photo.path).catch(noop))
      }
    }

    await Promise.all(p)

    this.context.send('print:ready')
  }

  render() {
    return (
      this.state.items.map(item =>
        <Item
          key={item.id}
          item={item}
          cache={this.state.cache}
          canOverflow={this.state.canOverflow}
          hasMetadata={this.state.hasMetadata}
          hasNotes={this.state.hasNotes}/>)
    )
  }

  static contextType = WindowContext
}


module.exports = {
  PrintContainer
}
