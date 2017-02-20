'use strict'

const React = require('react')
const { PropTypes } = React
const { Thumbnail } = require('../photo')
const { pick, get } = require('../../common/util')
const cx = require('classnames')
const { shape, number, arrayOf } = PropTypes

const ThumbProps = Object.keys(Thumbnail.propTypes)

const card = ({ photos }) =>
  photos && photos.length || 0

const cover = (item) =>
  item.cover || get(item, ['photos', 0])


const CoverImage = ({ item, ...props }) => (
  <div className={cx({ 'cover-image': true, 'stack': card(item) > 1 })}>
    <Thumbnail {...pick(props, ThumbProps)} id={cover(item)}/>
  </div>
)

CoverImage.propTypes = {
  ...Thumbnail.propTypes,
  item: shape({
    photos: arrayOf(number),
    cover: number
  }).isRequired,
}

module.exports = {
  CoverImage
}
