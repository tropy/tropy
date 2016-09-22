'use strict'

const React = require('react')

const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { Editable } = require('./editable')
const { IconFolder } = require('./icons')
const { children } = require('../selectors/list')
const { create, save, remove } = require('../actions/list')
const { noop } = require('../common/util')


class List extends Component {

  static propTypes = {
    list: PropTypes.object,
    onCancel: PropTypes.func,
    onUpdate: PropTypes.func
  }

  static defaultProps = {
    onCancel: noop,
    onUpdate: noop
  }

  update = (name) => {
    this.props.onUpdate(this.props.list, { name })
  }

  cancel = () => {
    this.props.onCancel(this.props.list)
  }

  render() {
    const { list } = this.props

    return (
      <li className="list">
        <IconFolder/>
        <div className="title">
          <Editable
            value={list.name}
            onChange={this.update}
            onCancel={this.cancel}/>
        </div>
      </li>
    )
  }
}


const Lists = ({ lists, onUpdate, onCancel }) => (
  <ol className="lists">
    {
      lists.map(list => (
        <List
          key={list.id}
          list={list}
          onUpdate={onUpdate}
          onCancel={onCancel}/>
      ))
    }
  </ol>
)

Lists.propTypes = {
  lists: PropTypes.array,
  parent: PropTypes.number,
  tmp: PropTypes.bool,
  onCancel: PropTypes.func,
  onUpdate: PropTypes.func
}

module.exports = {
  Lists: connect(

    () => {
      const selector = children()

      return (state, props) => ({
        lists: selector(state, props)
      })
    },

    dispatch => ({
      onCancel({ id, tmp }) {
        if (tmp) dispatch(remove(id))
      },

      onUpdate({ id, tmp }, values) {
        dispatch(tmp ? create([id, values]) : save([id, values]))
      }
    })

  )(Lists)
}
