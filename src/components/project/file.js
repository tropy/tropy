import { basename } from 'node:path'
import React from 'react'
import { arrayOf,  func, number, string } from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { Button } from '../button.js'
import { IconMaze, IconWarningSm, IconXMedium } from '../icons.js'
import { RelativeDate } from '../date.js'


export const ProjectFileList = ({
  files,
  onRemove,
  onSelect
}) => (
  <ol className="project-files">
    {files.map(path =>
      <ProjectFile
        key={path}
        onClick={onSelect}
        onRemove={onRemove}
        path={path}/>
    )}
  </ol>
)

ProjectFileList.propTypes = {
  files: arrayOf(string).isRequired,
  onRemove: func,
  onSelect: func
}

export const ProjectFile = ({
  path,
  onConsolidate,
  onClick,
  onRemove
}) => (
  <li
    className="project-file"
    onClick={() => onClick?.(path)}
    title={path}>
    <IconMaze/>
    <div className="flex-col">
      <div className="name">
        <div className="truncate">{basename(path)}</div>
        {
          Math.random() > 0.75 && (
            <Button
              icon={<IconWarningSm/>}
              onClick={() => onConsolidate?.(path)}
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
    <Button
      icon={<IconXMedium/>}
      onClick={() => onRemove?.(path)}/>
  </li>
)

ProjectFile.propTypes = {
  path: string.isRequired,
  onConsolidate: func,
  onClick: func,
  onRemove: func
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
