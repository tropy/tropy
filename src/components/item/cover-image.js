'use strict'

const React = require('react')
const { PropTypes } = React
const { Thumbnail } = require('../photo')
const { pick, get } = require('../../common/util')
const { shape, number, arrayOf } = PropTypes

const ThumbProps = Object.keys(Thumbnail.propTypes)

const card = ({ photos }) =>
  photos && photos.length || 0

const cover = (item) =>
  item.cover || get(item, ['photos', 0])

const stack = (
  <div className="stack-lines">
    <div className="line line-2"/>
    <div className="line line-1"/>
  </div>
)

const CoverImage = ({ item, ...props }) => (
  <div className="cover-image">
    <Thumbnail {...pick(props, ThumbProps)} id={cover(item)}/>
    {(card(item) > 1) && stack }
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
