import { basename } from 'node:path'
import React from 'react'
import { arrayOf,  func, number, shape, string } from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { Button } from '../button.js'
import { IconMaze, IconWarningSm, IconXMedium } from '../icons.js'
import { RelativeDate } from '../date.js'

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

export const ProjectFileList = ({
  files,
  onRemove,
  onSelect
}) => (
  <ol className="project-files">
    {files.map(({ path, ...stats }) =>
      <ProjectFile
        key={path}
        onClick={onSelect}
        onRemove={onRemove}
        path={path}
        stats={stats}/>
    )}
  </ol>
)

ProjectFileList.propTypes = {
  files: arrayOf(shape({
    path: string.isRequired
  })).isRequired,
  onRemove: func,
  onSelect: func
}

export const ProjectFile = ({
  path,
  onConsolidate,
  onClick,
  onRemove,
  stats
}) => (
  <li
    className="project-file"
    onClick={() => onClick?.(path)}
    title={path}>
    <IconMaze/>
    <div className="flex-col">
      <div className="name">
        <div className="truncate">{stats?.name || basename(path)}</div>
        {
          !stats?.lastModified && (
            <Button
              icon={<IconWarningSm/>}
              onClick={() => onConsolidate?.(path)}
              title="project.new.find-missing"/>
          )
        }
      </div>
      <ProjectFileStats {...stats}/>
    </div>
    <Button
      icon={<IconXMedium/>}
      onClick={() => onRemove?.(path)}/>
  </li>
)

ProjectFile.propTypes = {
  path: string.isRequired,
  stats: shape(ProjectFileStats.propsTypes),
  onConsolidate: func,
  onClick: func,
  onRemove: func
}
