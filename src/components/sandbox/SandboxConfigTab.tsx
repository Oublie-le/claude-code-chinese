import * as React from 'react'
import { Box, Text } from '@anthropic/ink'
import {
  SandboxManager,
  shouldAllowManagedSandboxDomainsOnly,
} from '../../utils/sandbox/sandbox-adapter.js'
import { t } from '../../utils/language.js'

export function SandboxConfigTab(): React.ReactNode {
  const isEnabled = SandboxManager.isSandboxingEnabled()

  // Show warnings (e.g., seccomp not available on Linux)
  const depCheck = SandboxManager.checkDependencies()
  const warningsNote =
    depCheck.warnings.length > 0 ? (
      <Box marginTop={1} flexDirection="column">
        {depCheck.warnings.map((w, i) => (
          <Text key={i} dimColor>
            {w}
          </Text>
        ))}
      </Box>
    ) : null

  if (!isEnabled) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text color="subtle">{t('sandboxConfig.disabled')}</Text>
        {warningsNote}
      </Box>
    )
  }

  const fsReadConfig = SandboxManager.getFsReadConfig()
  const fsWriteConfig = SandboxManager.getFsWriteConfig()
  const networkConfig = SandboxManager.getNetworkRestrictionConfig()
  const allowUnixSockets = SandboxManager.getAllowUnixSockets()
  const excludedCommands = SandboxManager.getExcludedCommands()
  const globPatternWarnings = SandboxManager.getLinuxGlobPatternWarnings()

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Excluded Commands */}
      <Box flexDirection="column">
        <Text bold color="permission">
          {t('sandboxConfig.excludedCmds')}
        </Text>
        <Text dimColor>
          {excludedCommands.length > 0 ? excludedCommands.join(', ') : t('sandboxConfig.none')}
        </Text>
      </Box>

      {/* Filesystem Read Restrictions */}
      {fsReadConfig.denyOnly.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="permission">
            {t('sandboxConfig.fsRead')}
          </Text>
          <Text dimColor>Denied: {fsReadConfig.denyOnly.join(', ')}</Text>
          {fsReadConfig.allowWithinDeny &&
            fsReadConfig.allowWithinDeny.length > 0 && (
              <Text dimColor>
                Allowed within denied: {fsReadConfig.allowWithinDeny.join(', ')}
              </Text>
            )}
        </Box>
      )}

      {/* Filesystem Write Restrictions */}
      {fsWriteConfig.allowOnly.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="permission">
            {t('sandboxConfig.fsWrite')}
          </Text>
          <Text dimColor>Allowed: {fsWriteConfig.allowOnly.join(', ')}</Text>
          {fsWriteConfig.denyWithinAllow.length > 0 && (
            <Text dimColor>
              Denied within allowed: {fsWriteConfig.denyWithinAllow.join(', ')}
            </Text>
          )}
        </Box>
      )}

      {/* Network Restrictions */}
      {((networkConfig.allowedHosts && networkConfig.allowedHosts.length > 0) ||
        (networkConfig.deniedHosts &&
          networkConfig.deniedHosts.length > 0)) && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="permission">
            {shouldAllowManagedSandboxDomainsOnly() ? t('sandboxConfig.networkManaged') : t('sandboxConfig.network')}
          </Text>
          {networkConfig.allowedHosts &&
            networkConfig.allowedHosts.length > 0 && (
              <Text dimColor>
                Allowed: {networkConfig.allowedHosts.join(', ')}
              </Text>
            )}
          {networkConfig.deniedHosts &&
            networkConfig.deniedHosts.length > 0 && (
              <Text dimColor>
                Denied: {networkConfig.deniedHosts.join(', ')}
              </Text>
            )}
        </Box>
      )}

      {/* Unix Sockets */}
      {allowUnixSockets && allowUnixSockets.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="permission">
            {t('sandboxConfig.unixSockets')}
          </Text>
          <Text dimColor>{allowUnixSockets.join(', ')}</Text>
        </Box>
      )}

      {/* Linux Glob Pattern Warning */}
      {globPatternWarnings.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="warning">
            {t('sandboxConfig.globWarn')}
          </Text>
          <Text dimColor>
            {t('sandboxConfig.globIgnored')}{' '}
            {globPatternWarnings.slice(0, 3).join(', ')}
            {globPatternWarnings.length > 3 &&
              ` (${globPatternWarnings.length - 3} more)`}
          </Text>
        </Box>
      )}

      {warningsNote}
    </Box>
  )
}
