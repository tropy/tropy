'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { ItemPanel } = require('./panel')
const { PhotoPanel } = require('../photo')
const { StatelessResizable, Resizable } = require('../resizable')
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

  get offset() {
    return this.isItemOpen ? 0 : `calc(100% - ${this.props.offset}px)`
  }

  get style() {
    return {
      transform: `translate3d(${this.offset}, 0, 0)`
    }
  }

  handlePanelResize = (width) => {
    this.props.onUiUpdate({ panel: { width } })
  }

  handleEsperResize = (height) => {
    this.props.onUiUpdate({ esper: { height } })
  }


  render() {
    const {
      esper,
      panel,
      photo,
      offset,
      onPanelResize,
      ...props
    } = this.props

    const { isItemOpen, isDisabled } = this

    return (
      <section className="item view" style={this.style}>
        <StatelessResizable
          edge={isItemOpen ? 'right' : 'left'}
          value={offset}
          min={PhotoPanel.minWidth}
          max={750}
          onResize={onPanelResize}
          onResizeStop={this.handlePanelResize}>
          <ItemPanel {...pick(props, ItemPanel.props)}
            panel={panel}
            photo={photo}
            isItemOpen={isItemOpen}
            isDisabled={isDisabled}/>
        </StatelessResizable>

        <div className="item-container">
          <Resizable
            edge="bottom"
            value={esper.height}
            isRelative
            onChange={this.handleEsperResize}
            min={256}>
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

    offset: number.isRequired,

    esper: shape({
      height: number.isRequired
    }).isRequired,

    mode: string.isRequired,
    onPanelResize: func.isRequired,
    onUiUpdate: func.isRequired
  }
}

delete ItemView.propTypes.isDisabled
delete ItemView.propTypes.isItemOpen


module.exports = {
  ItemView
}
