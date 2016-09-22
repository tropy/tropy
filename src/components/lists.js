'use strict'

const React = require('react')

const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { Editable } = require('./editable')
const { IconFolder } = require('./icons')
const { children } = require('../selectors/list')
const { create, save, remove } = require('../actions/list')
const { noop } = require('../common/util')
const nav = require('../actions/nav')
const cn = require('classnames')


class List extends Component {

  static propTypes = {
    list: PropTypes.object,
    active: PropTypes.bool,
    onCancel: PropTypes.func,
    onSelect: PropTypes.func,
    onUpdate: PropTypes.func
  }

  static defaultProps = {
    onCancel: noop,
    onSelect: noop,
    onUpdate: noop
  }

  update = (name) => {
    this.props.onUpdate(this.props.list, { name })
  }

  select = () => {
    this.props.onSelect(this.props.list.id)
  }

  cancel = () => {
    this.props.onCancel(this.props.list)
  }

  render() {
    const { list, active } = this.props

    return (
      <li
        className={cn({ list: true, active })}
        onClick={this.select}>
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


const Lists = ({ lists, current, onUpdate, onCancel, onSelect }) => (
  <ol className="lists">
    {
      lists.map(list => (
        <List
          key={list.id}
          active={current === list.id}
          list={list}
          onUpdate={onUpdate}
          onSelect={onSelect}
          onCancel={onCancel}/>
      ))
    }
  </ol>
)

Lists.propTypes = {
  lists: PropTypes.array,
  current: PropTypes.number,
  parent: PropTypes.number,
  tmp: PropTypes.bool,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func,
  onUpdate: PropTypes.func
}

module.exports = {
  Lists: connect(

    () => {
      const selector = children()

      return (state, props) => ({
        current: state.nav.list,
        lists: selector(state, props)
      })
    },

    dispatch => ({
      onCancel({ id, tmp }) {
        if (tmp) dispatch(remove(id))
      },

      onSelect(list) {
        dispatch(nav.update({ list }))
      },

      onUpdate({ id, tmp }, values) {
        dispatch(tmp ? create([id, values]) : save([id, values]))
      }
    })

  )(Lists)
}
