'use strict'

const React = require('react')
const { Item } = require('./item')
const { WindowContext } = require('../main')
const { delay, noop } = require('../../common/util')
const { loadImage } = require('../../dom')
const { join } = require('path')
const { debug } = require('../../common/log')


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
    await Promise.all(
      this.state.items
        .flatMap(item => item.photos)
        .map(photo => loadImage(photo.path).catch(noop)))

    // Hack: All images need to be decoded before we open
    // the print dialog. Instead of using image.decode() on
    // every image instance we just estimate a reasonable
    // delay here and hope for the best!
    await delay(500)

    debug('images loaded for printing')
    requestIdleCallback(() => {
      this.context.send('print:ready')
    })
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
