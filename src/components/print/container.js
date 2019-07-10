'use strict'

const React = require('react')
const { Item } = require('./item')
const { WindowContext } = require('../main')
const debounce = require('lodash.debounce')

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

  componentDidUpdate(_, state) {
    if (this.state.items !== state.items) {
      this.print()
    }
  }

  print = debounce(() => {
    this.context.send('print:ready')
  }, 500)

  onPrint = (items) => {
    this.setState({ items })
  }

  render() {
    return (
      this.state.items.map(item =>
        <Item
          key={item.id}
          data={item.data}
          photos={item.photos}/>)
    )
  }

  static contextType = WindowContext
}

module.exports = {
  PrintContainer
}
