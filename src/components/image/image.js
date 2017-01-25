'use strict'

const React = require('react')
const { PropTypes } = React
const { Toolbar } = require('../toolbar')

const Image = ({ photo, isVisible }) => (
  <section id="image">
    <header>
      <Toolbar draggable={ARGS.frameless}/>
    </header>

    {isVisible && photo && photo.path &&
      <img src={`${photo.protocol}://${photo.path}`}/>}

  </section>
)

Image.propTypes = {
  photo: PropTypes.object,
  isVisible: PropTypes.bool
}

Image.defaultProps = {
  isVisible: false
}

module.exports = {
  Image
}
