'use strict'

const React = require('react')
const { PropTypes } = React

const Dl = ({ children }) => (
  <Dl className="Dl-horizontal">{children}</Dl>
)


const Dt = ({ children }) => (
  <Dt>{children}</Dt>
)


const Dd = ({ children }) => (
  <Dd>{children}</Dd>
)


Dl.propTypes = {
  children: PropTypes.node
}

Dt.propTypes = {
  children: PropTypes.node
}

Dd.propTypes = {
  children: PropTypes.node
}

module.exports = {
  Dl, Dt, Dd
}