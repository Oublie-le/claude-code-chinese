import React, { useCallback, useState } from 'react'
import { Box, Text } from '@anthropic/ink'
import { getDisplayPath } from '../utils/file.js'
import {
  removePathFromRepo,
  validateRepoAtPath,
} from '../utils/githubRepoPathMapping.js'
import { t } from '../utils/language.js'
import { Select } from './CustomSelect/index.js'
import { Dialog } from '@anthropic/ink'
import { Spinner } from './Spinner.js'

type Props = {
  targetRepo: string
  initialPaths: string[]
  onSelectPath: (path: string) => void
  onCancel: () => void
}

export function TeleportRepoMismatchDialog({
  targetRepo,
  initialPaths,
  onSelectPath,
  onCancel,
}: Props): React.ReactNode {
  const [availablePaths, setAvailablePaths] = useState<string[]>(initialPaths)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)

  const handleChange = useCallback(
    async (value: string): Promise<void> => {
      if (value === 'cancel') {
        onCancel()
        return
      }

      setValidating(true)
      setErrorMessage(null)

      const isValid = await validateRepoAtPath(value, targetRepo)

      if (isValid) {
        onSelectPath(value)
        return
      }

      // Path is invalid - remove it from config and update state
      removePathFromRepo(targetRepo, value)
      const updatedPaths = availablePaths.filter(p => p !== value)
      setAvailablePaths(updatedPaths)
      setValidating(false)

      setErrorMessage(
        t('teleport.repoMismatch.noLongerValid', { path: getDisplayPath(value) }),
      )
    },
    [targetRepo, availablePaths, onSelectPath, onCancel],
  )

  const options = [
    ...availablePaths.map(path => ({
      label: (
        <Text>
          {t('teleport.repoMismatch.use')} <Text bold>{getDisplayPath(path)}</Text>
        </Text>
      ),
      value: path,
    })),
    { label: t('teleport.cancel'), value: 'cancel' },
  ]

  return (
    <Dialog title={t('teleport.repoMismatch.title')} onCancel={onCancel} color="background">
      {availablePaths.length > 0 ? (
        <>
          <Box flexDirection="column" gap={1}>
            {errorMessage && <Text color="error">{errorMessage}</Text>}
            <Text>
              {t('teleport.repoMismatch.openIn')} <Text bold>{targetRepo}</Text>:
            </Text>
          </Box>

          {validating ? (
            <Box>
              <Spinner />
              <Text> {t('teleport.repoMismatch.validating')}</Text>
            </Box>
          ) : (
            <Select
              options={options}
              onChange={value => void handleChange(value)}
            />
          )}
        </>
      ) : (
        <Box flexDirection="column" gap={1}>
          {errorMessage && <Text color="error">{errorMessage}</Text>}
          <Text dimColor>
            {t('teleport.repoMismatch.runFrom')} {targetRepo}
          </Text>
        </Box>
      )}
    </Dialog>
  )
}
