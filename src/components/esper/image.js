'use strict'

const React = require('react')
const { PropTypes } = React
const { Toolbar } = require('../toolbar')

const EsperImage = ({ photo, isVisible }) => (
  <section className="esper">
    <header>
      <Toolbar draggable={ARGS.frameless}/>
    </header>

    {isVisible && photo && photo.path &&
      <img src={`${photo.protocol}://${photo.path}`}/>}

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
