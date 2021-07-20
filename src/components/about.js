import React from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { string } from 'prop-types'
import { shell } from 'electron'
import { product, version } from '../common/release'
import { Titlebar } from './toolbar'

const Link = ({ id, ...opts }) => {
  let intl = useIntl()

  let url = intl.formatMessage({ id: `${id}.url` }, opts)
  let title = intl.formatMessage({ id: `${id}.title` }, opts)

  return (
    <a onClick={() => shell.openExternal(url)}>{title}</a>
  )
}

Link.propTypes = {
  id: string.isRequired
}

export const About = () => (
  <div className="about-view">
    <Titlebar isOptional/>
    <figure className="app-icon"/>
    <div className="flex-row center">
      <h1><span className="product">{product}</span></h1>
      <p className="version">
        <FormattedMessage id="about.version" values={{ version }}/>
        {process.arch}
      </p>
      <p>
        <FormattedMessage
          id="about.text"
          values={{
            c2dh: <Link id="about.c2dh"/>,
            rrchnm: <Link id="about.rrchnm"/>
          }}/>
      </p>
      <p>
        <FormattedMessage
          id="about.trademark"
          values={{ cds: <Link id="about.cds"/> }}/>
      </p>
      <p className="links">
        <Link id="about.release" version={version}/>
        <Link id="about.license"/>
        <Link id="about.credits"/>
      </p>
    </div>
  </div>
)
