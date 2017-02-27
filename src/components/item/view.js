'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { ItemPanel } = require('./panel')
const { Resizable } = require('../resizable')
const { Image } = require('../image')
const { NotePad } = require('../note')
const { MODE } = require('../../constants/project')
const { pick } = require('../../common/util')
const { func, arrayOf, shape, number, bool, string } = PropTypes


class ItemView extends PureComponent {

  get item() { // remove?
    const { items } = this.props
    return items.length === 1 ? items[0] : null
  }

  get photo() { // selector
    const { photo, photos } = this.props
    return photo ? photos.find(({ id }) => id === photo) : null
  }

  get isDisabled() { // keep here!
    const { item } = this
    return !(item && !item.deleted)
  }

  get isItemOpen() {
    return this.props.mode === MODE.ITEM
  }

  handlePanelResize = (width) => {
    this.props.onUiPanelUpdate({ width })
  }


  render() {
    const {
      panel,
      ...props
    } = this.props

    const { isItemOpen, photo, isDisabled } = this

    return (
      <section id="item-view">
        <Resizable
          edge={isItemOpen ? 'right' : 'left'}
          value={panel.width}
          min={225}
          max={750}
          onResize={this.handlePanelResize}>
          <ItemPanel {...pick(props, ItemPanel.props)}
            panel={panel}
            isItemOpen={isItemOpen}
            isDisabled={isDisabled}/>
        </Resizable>

        <div className="item-container">
          <Image isVisible photo={photo}/>
          <NotePad/>
        </div>
      </section>
    )
  }


  static propTypes = {
    ...ItemPanel.propTypes,

    items: arrayOf(
      shape({
        id: number.isRequired,
        tags: arrayOf(number),
        deleted: bool
      })
    ),

    panel: shape({
      width: number.isRequired
    }).isRequired,

    mode: string.isRequired,
    onUiPanelUpdate: func.isRequired
  }
}

delete ItemView.propTypes.isDisabled
delete ItemView.propTypes.isItemOpen


module.exports = {
  ItemView
}
