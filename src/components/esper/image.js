'use strict'

const React = require('react')
const { PropTypes } = React
const { Toolbar } = require('../toolbar')
const { IconButton } = require('../button')

const {
  IconArrow,
  IconSelection,
  IconRotate,
  IconNut,
  IconHand,
  IconMinusCircle,
  IconPlusCircle,
  IconFit
} = require('../icons')

const EsperImage = ({ photo, isVisible }) => (
  <section className="esper">
    <header className="esper-header draggable">
      <Toolbar draggable={ARGS.frameless}>
        <div className="toolbar-left">
          <div className="tool-group">
            <IconButton icon={<IconArrow/>}/>
            <IconButton icon={<IconSelection/>}/>
          </div>
          <div className="tool-group">
            <IconButton icon={<IconRotate/>}/>
            <IconButton icon={<IconNut/>}/>
          </div>
          <div className="tool-group">
            <IconButton icon={<IconHand/>}/>
            <IconButton icon={<IconMinusCircle/>}/>
            <IconButton icon={<IconPlusCircle/>}/>
            <IconButton icon={<IconFit/>}/>
          </div>
        </div>
      </Toolbar>
    </header>

    {isVisible && photo && photo.path &&
      <div className="mask-original">
        <img className="original" src={`${photo.protocol}://${photo.path}`}/>
      </div>}

    {isVisible && photo && photo.path &&
      <div className="mask-blur">
        <img className="blur" src={`${photo.protocol}://${photo.path}`}/>
      </div>}

  </section>
)

EsperImage.propTypes = {
  photo: PropTypes.object,
  isVisible: PropTypes.bool
}

EsperImage.defaultProps = {
  isVisible: false
}

module.exports = {
  EsperImage
}
