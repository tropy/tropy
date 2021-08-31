import { join } from 'path'
import React from 'react'
import ARGS from '../../args'
import { Item } from './item'
import { WindowContext } from '../window'
import { delay, noop } from '../../common/util'
import { loadImage } from '../../dom'
import { debug } from '../../common/log'


export class PrintContainer extends React.Component {
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
      hasPhotos: opts.photos,
      hasMetadata: opts.metadata,
      hasNotes: opts.notes,
      hasOnlyNotes: opts.onlyNotes,
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
          hasPhotos={this.state.hasPhotos}
          hasMetadata={this.state.hasMetadata}
          hasNotes={this.state.hasNotes}
          hasOnlyNotes={this.state.hasOnlyNotes}/>)
    )
  }

  static contextType = WindowContext
}
