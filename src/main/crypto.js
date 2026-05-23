import { safeStorage } from 'electron'

export const encrypt = async (string) => {
  if (await safeStorage.isAsyncEncryptionAvailable()) {
    return await safeStorage.encryptStringAsync(string)
  }
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(string)
  }
  throw new Error('no encryption available')
}

export const decrypt = async (data) => {
  if (await safeStorage.isAsyncEncryptionAvailable()) {
    return (await safeStorage.decryptStringAsync(data)).result
  }
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(data)
  }
  throw new Error('no encryption available')
}
