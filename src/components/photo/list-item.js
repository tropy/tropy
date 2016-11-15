'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { connect } = require('react-redux')


class ListItem extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { photo, data, title } = this.props

    return (
      <li key={photo.id} className="photo">
        <img src="dev/dummy-24-2x.jpg"
          width={24} height={24} className="thumbnail"/>
        <div className="title">
          {data[title] && data[title].value}
        </div>
      </li>
    )
  }

  static propTypes = {
    photo: PropTypes.shape({
      id: PropTypes.number.isRequired
    }).isRequired,
    data: PropTypes.object,
    title: PropTypes.string
  }

  static defaultProps = {
    title: 'title'
  }
}


module.exports = {
  ListItem: connect(
    (state, { photo }) => ({
      data: state.metadata[photo.id] || {}
    })
  )(ListItem)
}
