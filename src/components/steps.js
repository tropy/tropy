'use strict'

const React = require('react')
const { PropTypes, Children } = React

const Steps = ({ children }) => (
  <div className="steps">
    {children}
  </div>
)

Steps.propTypes = {
  current: PropTypes.number,
  children: (props, name, comp) => {
    Children.forEach(props[name], child => {
      if (child.type !== Step) {
        throw new Error(`${comp} must contain only Step components.`)
      }
    })
  }
}

Steps.defaultProps = {
  current: 1
}

const Step = ({ children }) => (
  <div className="step">
    {children}
  </div>
)

Step.propTypes = {
  children: PropTypes.element.isRequired
}

module.exports = {
  Steps, Step
}
