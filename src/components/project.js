'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { ProjectDropZone } = require('./project/drop-zone')
const { ProjectSidebar } = require('./project/sidebar')
const { Resizable } = require('./resizable')
const { Item, Items } = require('./item')
const { MODE } = require('../constants/project')
const cn = require('classnames')
const values = require('object.values')
const actions = require('../actions')


class Project extends Component {
  constructor(props) {
    super(props)

    this.state = {
      mode: props.mode,
      willModeChange: false,
      isModeChanging: false
    }
  }

  componentWillUnmount() {
    this.clearTimeouts()
  }

  componentWillReceiveProps({ mode }) {
    console.log(`received props mode ${mode} (${this.props.mode})`)
    if (mode !== this.props.mode) {
      this.modeWillChange(mode)
    }
  }

  modeWillChange(mode) {
    console.log(`mode will change ${this.state.mode} -> ${mode}`)
    if (mode === this.state.mode) {
      this.setState({ willModeChange: false, isModeChanging: false })

    } else {
      this.setState({ willModeChange: true, isModeChanging: false })

      setTimeout(() => {
        console.log('mode is changing')
        this.setState({ isModeChanging: true })
      }, 0)

      this.tetid = setTimeout(this.handleTransitionEnd, 5000)
    }
  }

  clearTimeouts() {
    if (this.tetid) {
      this.tetid = clearTimeout(this.tetid), undefined
    }
  }

  get classes() {
    const { willModeChange, isModeChanging } = this.state

    return {
      [`${this.state.mode}-mode`]: true,
      [`${this.state.mode}-mode-leave`]: willModeChange,
      [`${this.state.mode}-mode-leave-active`]: isModeChanging,
      [`${this.props.mode}-mode-enter`]: willModeChange,
      [`${this.props.mode}-mode-enter-active`]: isModeChanging
    }
  }

  handleTransitionEnd = () => {
    console.log('transition end')
    this.clearTimeouts()

    this.setState({
      mode: this.props.mode,
      willModeChange: false,
      isModeChanging: false
    })
  }

  handleContextMenu = (event) => {
    this.props.onContextMenu(event)
  }

  handleModeChange = (mode) => {
    this.props.onModeChange(mode)
  }

  render() {
    const { onContextMenu, onDrop } = this.props
    const { mode } = this.state

    console.log(`rendering: ${cn(this.classes)}`)

    return (
      <div
        id="project"
        className={cn(this.classes)}
        onTransitionEnd={this.handleTransitionEnd}
        onContextMenu={this.handleContextMenu}>
        <ProjectDropZone onDrop={onDrop}>
          <div id="project-view">
            <Resizable edge="right" value={250}>
              <ProjectSidebar
                hasToolbar={ARGS.frameless}
                onContextMenu={onContextMenu}/>
            </Resizable>
            <main>
              <Items onContextMenu={onContextMenu}/>
            </main>
          </div>
          <Item mode={mode} onModeChange={this.handleModeChange}/>
        </ProjectDropZone>
      </div>
    )
  }

  static propTypes = {
    mode: PropTypes.oneOf(values(MODE)).isRequired,
    onContextMenu: PropTypes.func,
    onDrop: PropTypes.func,
    onModeChange: PropTypes.func
  }

  static defaultProps = {
    mode: MODE.PROJECT
  }
}


module.exports = {
  Project: connect(
    state => ({
      mode: state.nav.mode
    }),

    dispatch => ({
      onContextMenu(event, ...args) {
        event.stopPropagation()
        dispatch(actions.ui.context.show(event, ...args))
      },

      onDrop({ project, images }) {
        if (project) {
          return dispatch(actions.project.open(project))
        }

        if (images && images.length) {
          return dispatch(actions.item.import(images))
        }
      },

      onModeChange(mode) {
        dispatch(actions.nav.update({ mode }))
      }
    })
  )(Project)
}
