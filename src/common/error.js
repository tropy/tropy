export class DuplicateError extends Error {
  constructor(file) {
    super(`Duplicate file detected: ${file}`)
    this.file = file
  }
}
