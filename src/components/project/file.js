import { basename } from 'node:path'
import React from 'react'
import { arrayOf,  func, number, string } from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { Button } from '../button.js'
import { IconMaze, IconWarningSm, IconXMedium } from '../icons.js'
import { RelativeDate } from '../date.js'


export const ProjectFileList = ({
  files,
  onClick
}) => (
  <ol className="project-files">
    {files.map(path =>
      <ProjectFile
        key={path}
        onClick={onClick}
        path={path}/>
    )}
  </ol>
)

ProjectFileList.propTypes = {
  files: arrayOf(string).isRequired,
  onClick: func
}

export const ProjectFile = ({
  path,
  onClick
}) => (
  <li
    className="project-file"
    onClick={() => onClick(path)}
    title={path}>
    <IconMaze/>
    <div className="flex-col">
      <div className="name">
        <div className="truncate">{basename(path)}</div>
        {
          Math.random() > 0.75 && (
            <Button
              icon={<IconWarningSm/>}
              title="project.new.find-missing"/>
          )
        }
      </div>
      <ProjectFileStats
        lastModified={Date.now() - Math.random() * 100000}
        items={Math.round(1167 * Math.random())}
        photos={Math.round(4959 * Math.random())}
        notes={Math.round(182 * Math.random())}/>
    </div>
    <Button icon={<IconXMedium/>}/>
  </li>
)

ProjectFile.propTypes = {
  path: string.isRequired,
  onClick: func
}

export const ProjectFileStats = ({ lastModified, ...values }) =>
  (lastModified != null) && (
    <ul className="stats">
      <li>
        <RelativeDate value={lastModified}/>
      </li>
      <li>
        <FormattedMessage id="project.stats.items" values={values}/>
      </li>
      <li>
        <FormattedMessage id="project.stats.photos" values={values}/>
      </li>
      <li>
        <FormattedMessage id="project.stats.notes" values={values}/>
      </li>
    </ul>
  )

ProjectFileStats.propTypes = {
  items: number,
  lastModified: number,
  notes: number,
  photos: number
}
