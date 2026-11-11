import { app, safeStorage } from 'electron'
import { randomUUID } from 'node:crypto'
import { readFile, writeFile, unlink, mkdir, rename } from 'node:fs/promises'
import { join } from 'node:path'

const credentialPath = (): string => join(app.getPath('userData'), 'download-credential.bin')

export async function readCredential(): Promise<string | null> {
  try {
    const encrypted = await readFile(credentialPath())
    const decrypted = await safeStorage.decryptStringAsync(encrypted)
    if (decrypted.shouldReEncrypt) await saveCredential(decrypted.result)
    return decrypted.result
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw new Error(
      'The saved download credential could not be unlocked. Remove it or unlock your system keyring.'
    )
  }
}

export async function saveCredential(token: string): Promise<void> {
  if (!(await safeStorage.isAsyncEncryptionAvailable())) {
    throw new Error(
      'Secure credential storage is unavailable. Unlock your system keyring and try again.'
    )
  }
  // Linux basic_text is not secure storage and must never be used for tokens.
  if (process.platform === 'linux' && safeStorage.getSelectedStorageBackend() === 'basic_text') {
    throw new Error('A system keyring is required to save download credentials.')
  }
  const encrypted = await safeStorage.encryptStringAsync(token)
  await mkdir(app.getPath('userData'), { recursive: true })
  const target = credentialPath()
  const temporary = `${target}.${randomUUID()}.tmp`
  try {
    await writeFile(temporary, encrypted, { flag: 'wx', mode: 0o600 })
    await rename(temporary, target)
  } finally {
    await unlink(temporary).catch(() => undefined)
  }
}

export async function removeCredential(): Promise<void> {
  await unlink(credentialPath()).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error
  })
}
