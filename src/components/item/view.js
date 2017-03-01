'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { ItemPanel } = require('./panel')
const { PhotoPanel } = require('../photo')
const { Resizable } = require('../resizable')
const { EsperImage } = require('../esper')
const { NotePad } = require('../note')
const { MODE } = require('../../constants/project')
const { pick } = require('../../common/util')
const { func, arrayOf, shape, number, bool, string } = PropTypes


class ItemView extends PureComponent {

  get item() { // remove?
    const { items } = this.props
    return items.length === 1 ? items[0] : null
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

  handleEsperResize = () => {
  }


  render() {
    const {
      esper,
      panel,
      photo,
      ...props
    } = this.props

    const { isItemOpen, isDisabled } = this

    return (
      <section id="item-view">
        <Resizable
          edge={isItemOpen ? 'right' : 'left'}
          value={panel.width}
          min={PhotoPanel.minWidth}
          max={750}
          onChange={this.handlePanelResize}>
          <ItemPanel {...pick(props, ItemPanel.props)}
            panel={panel}
            photo={photo}
            isItemOpen={isItemOpen}
            isDisabled={isDisabled}/>
        </Resizable>

        <div className="item-container">
          <Resizable
            edge="bottom"
            value={esper.height}
            isRelative
            onChange={this.handleEsperResize}
            min={20}
            max={90}>
            <EsperImage isVisible photo={photo}/>
          </Resizable>
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

    esper: shape({
      height: number.isRequired
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
