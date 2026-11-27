import { useExternalDrop } from './use-external-drop.js'
import { hasPhotoFiles, hasProjectPaths } from '../components/dnd.js'

export const useDropPhotoFiles = ({ isDisabled, onDrop }) =>
  useExternalDrop({
    accept: hasPhotoFiles,
    canDrop: (data) =>
      (data.files.length > 0 || data.urls.length > 0) &&
      !hasProjectPaths(data),
    isDisabled,
    onDrop: ({ files, urls }) => onDrop({ files, urls })
  })
