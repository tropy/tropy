'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { getEmptyImage } = require('react-dnd-html5-backend')
const dnd = require('./dnd')


class PhotoIterable extends Component {
  static wrap() {
    return dnd.wrap(this)
  }

  constructor(props) {
    super(props)

    this.state = {
      offset: 0
    }
  }

  componentDidMount() {
    this.props.dp(getEmptyImage())
  }

  get classes() {
    return {
      photo: true,
      active: this.props.isSelected,
      context: this.props.isContext,
      over: this.props.isOver,
      dragging: this.props.isDragging,
      [this.direction]: this.props.isOver
    }
  }

  get direction() {
    return this.state.offset ? 'after' : 'before'
  }

  setContainer = (container) => {
    this.container = container
  }

  render() {
    return dnd.connect(this.props, this._render())
  }


  static propTypes = {
    isContext: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isDragging: PropTypes.bool,
    isEditing: PropTypes.bool,
    isOver: PropTypes.bool,
    isSelected: PropTypes.bool,

    photo: PropTypes.shape({
      id: PropTypes.number.isRequired,
      data: PropTypes.object
    }).isRequired,

    cache: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,

    ds: PropTypes.func.isRequired,
    dp: PropTypes.func.isRequired,

    onContextMenu: PropTypes.func
  }
}

module.exports = {
  PhotoIterable
}
