import figures from 'figures'
import React, { useEffect, useState } from 'react'
import { Box, Text, Dialog } from '@anthropic/ink'
import { logForDebugging } from '../utils/debug.js'
import type { GitFileStatus } from '../utils/git.js'
import { getFileStatus, stashToCleanState } from '../utils/git.js'
import { t } from '../utils/language.js'
import { Select } from './CustomSelect/index.js'
import { Spinner } from './Spinner.js'

type TeleportStashProps = {
  onStashAndContinue: () => void
  onCancel: () => void
}

export function TeleportStash({
  onStashAndContinue,
  onCancel,
}: TeleportStashProps): React.ReactNode {
  const [gitFileStatus, setGitFileStatus] = useState<GitFileStatus | null>(null)
  const changedFiles =
    gitFileStatus !== null
      ? [...gitFileStatus.tracked, ...gitFileStatus.untracked]
      : []
  const [loading, setLoading] = useState(true)
  const [stashing, setStashing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load changed files on mount
  useEffect(() => {
    const loadChangedFiles = async () => {
      try {
        const fileStatus = await getFileStatus()
        setGitFileStatus(fileStatus)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        logForDebugging(`Error getting changed files: ${errorMessage}`, {
          level: 'error',
        })
        setError(t('teleport.stash.failedToGet'))
      } finally {
        setLoading(false)
      }
    }

    void loadChangedFiles()
  }, [])

  const handleStash = async () => {
    setStashing(true)
    try {
      logForDebugging('Stashing changes before teleport...')
      const success = await stashToCleanState('Teleport auto-stash')

      if (success) {
        logForDebugging('Successfully stashed changes')
        onStashAndContinue()
      } else {
        setError('Failed to stash changes')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logForDebugging(`Error stashing changes: ${errorMessage}`, {
        level: 'error',
      })
      setError('Failed to stash changes')
    } finally {
      setStashing(false)
    }
  }

  const handleSelectChange = (value: string) => {
    if (value === 'stash') {
      void handleStash()
    } else {
      onCancel()
    }
  }

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Spinner />
          <Text> {t('teleport.stash.checking')}</Text>
        </Box>
      </Box>
    )
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="error">
          {t('teleport.stash.errorPrefix')} {error}
        </Text>
        <Box marginTop={1}>
          <Text dimColor>{t('teleport.stash.pressEscape')} </Text>
          <Text bold>{t('teleport.stash.escape')}</Text>
          <Text dimColor>{t('teleport.stash.toCancel')}</Text>
        </Box>
      </Box>
    )
  }

  const showFileCount = changedFiles.length > 8

  return (
    <Dialog title={t('teleport.stash.title')} onCancel={onCancel}>
      <Text>
        {t('teleport.stash.intro')}
      </Text>

      <Box flexDirection="column" paddingLeft={2}>
        {changedFiles.length > 0 ? (
          showFileCount ? (
            <Text>{t('teleport.stash.filesChanged', { count: String(changedFiles.length) })}</Text>
          ) : (
            changedFiles.map((file: string, index: number) => (
              <Text key={index}>{file}</Text>
            ))
          )
        ) : (
          <Text dimColor>{t('teleport.stash.noChanges')}</Text>
        )}
      </Box>

      <Text>
        {t('teleport.stash.question')}
      </Text>

      {stashing ? (
        <Box>
          <Spinner />
          <Text> {t('teleport.stash.stashing')}</Text>
        </Box>
      ) : (
        <Select
          options={[
            { label: t('teleport.stash.stashAndContinue'), value: 'stash' },
            { label: t('teleport.exit'), value: 'exit' },
          ]}
          onChange={handleSelectChange}
        />
      )}
    </Dialog>
  )
}
