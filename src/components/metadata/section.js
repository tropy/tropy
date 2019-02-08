'use strict'

const React = require('react')
const { bool, func, node, number, string } = require('prop-types')
const { FormattedMessage } = require('react-intl')
const cx = require('classnames')


const MetadataSection =
  ({ children, count, onContextMenu, separator, title }) => (
    <section onContextMenu={onContextMenu}>
      <h5 className={cx('metadata-heading', { separator })}>
        <FormattedMessage id={title} values={{ count }}/>
      </h5>
      {children}
    </section>
  )

MetadataSection.propTypes = {
  children: node.isRequired,
  count: number,
  onContextMenu: func,
  separator: bool,
  title: string.isRequired
}

module.exports = {
  MetadataSection
}
