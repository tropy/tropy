import React from 'react'
import { arrayOf,  func, number, object, shape, string } from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { useEvent } from '../../hooks/use-event.js'
import { Button } from '../button.js'
import { IconMaze, IconWarningSm, IconXMedium } from '../icons.js'
import { RelativeDate } from '../date.js'


export const ProjectFileList = ({
  files,
  onConsolidate,
  onRemove,
  onSelect
}) => (
  <ol className="project-files">
    {files.map(({ name, path, ...stats }) =>
      <ProjectFile
        key={path}
        name={name}
        onClick={onSelect}
        onConsolidate={onConsolidate}
        onRemove={onRemove}
        path={path}
        stats={stats}/>
    )}
  </ol>
)

ProjectFileList.propTypes = {
  files: arrayOf(shape({
    name: string.isRequired,
    path: string.isRequired
  })).isRequired,
  onConsolidate: func,
  onRemove: func,
  onSelect: func
}

export const ProjectFile = ({
  name,
  onClick,
  onConsolidate,
  onRemove,
  path,
  stats
}) => {
  let isMissing = !stats?.lastModified

  let handleClick = useEvent(() => {
    if (!isMissing) onClick?.(path)
  })

  let handleConsolidate = useEvent(() => {
    onConsolidate?.(path)
  })

  let handleRemove = useEvent(() => {
    onRemove?.(path)
  })

  return (
    <li
      className="project-file"
      onClick={handleClick}
      title={path}>
      <IconMaze/>
      <div className="flex-col">
        <div className="name">
          <div className="truncate">{name}</div>
          {
            isMissing && (
              <Button
                icon={<IconWarningSm/>}
                onClick={handleConsolidate}
                title="project.recent.missing"/>
            )
          }
        </div>
        <ProjectFileStats {...stats}/>
      </div>
      <Button
        icon={<IconXMedium/>}
        onClick={handleRemove}/>
    </li>
  )
}

ProjectFile.propTypes = {
  name: string.isRequired,
  onClick: func,
  onConsolidate: func,
  path: string.isRequired,
  stats: object,
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
