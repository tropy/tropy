'use strict'

const React = require('react')
const { PropTypes } = React
const { Thumbnail } = require('../photo')
const { get } = require('../../common/util')
const cn = require('classnames')

const { shape, number, arrayOf } = PropTypes

const card = (item) =>
  get(item, 'photos.length', 0)

const cover = (item) =>
  item.cover || get(item, ['photos', 0])


const CoverImage = ({ item, ...props }) => (
  <div className={cn({ 'cover-image': true, 'stack': card(item) > 1 })}>
    <Thumbnail {...props} id={cover(item)}/>
  </div>
)

CoverImage.propTypes = {
  item: shape({
    id: number.isRequired,
    photos: arrayOf(number),
    cover: number
  }).isRequired,
}

module.exports = {
  CoverImage
}
