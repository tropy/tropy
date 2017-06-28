'use strict'

const React = require('react')
const { PureComponent } = React
const { arrayOf, bool, number, object, string } = require('prop-types')
const { get } = require('../common/util')
const { IconTag } = require('./icons')


function Circle({ color, isCrescent }) {
  return (isCrescent) ?
    <IconTag className={`crescent color-${color}`}/> :
    <IconTag className={`color-${color}`}/>
}

Circle.propTypes = {
  color: string.isRequired,
  isCrescent: bool
}


class TagColors extends PureComponent {

  getColors() {
    const skip = {}
    const colors = []

    for (let id of this.props.selection) {
      let color = get(this.props.tags, [id, 'color'])
      if (color && !skip[color]) {
        skip[color] = true
        colors.push(color)
      }
    }

    return colors
  }

  render() {
    const colors = this.getColors()

    return (colors.length === 0) ? null : (
      <div className="tag colors">
        {colors.map((color, idx) =>
          <Circle key={color} color={color} isCrescent={idx > 0}/>)}
      </div>
    )
  }

  static propTypes = {
    selection: arrayOf(number).isRequired,
    tags: object.isRequired
  }

  static defaultProps = {
    colors: {
    }
  }
}

module.exports = {
  TagColors,
  Circle
}
