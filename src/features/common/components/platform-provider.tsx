import { useNetworkConfig, useShouldPromptForTokens } from '@/features/network/data'
import { useResolvedTheme } from '@/features/settings/data'
import { PropsWithChildren } from 'react'
import { WalletProvider } from './wallet-provider'
import { DataProvider } from './data-provider'
import { useTheme } from '../hooks/use-theme'
import { useSubscribeToBlocksEffect } from '@/features/blocks/data'
import { useDataProviderToken, useStateCleanupEffect } from '../data'
import { ToastContainer } from 'react-toastify'
import { useNfdDataLoaderEffect } from '@/features/nfd/data'
import { useCheckForAppUpdates } from '@/features/tauri/use-check-for-app-updates'

function RegisterGlobalEffects() {
  useSubscribeToBlocksEffect()
  useStateCleanupEffect()
  useNfdDataLoaderEffect()
  useCheckForAppUpdates()
  return <></>
}

export function PlatformProvider({ children }: PropsWithChildren) {
  const networkConfig = useNetworkConfig()
  const dataProviderToken = useDataProviderToken()
  const shouldPromptForTokens = useShouldPromptForTokens()
  const theme = useResolvedTheme()
  useTheme()

  const key = `${networkConfig.id}-${dataProviderToken}`

  // The DataProvider key prop is super important it governs if the provider is reinitialized
  const dataProvider = shouldPromptForTokens ? (
    <DataProvider key={`${key}-tokenprompt`} networkConfig={networkConfig}>
      <WalletProvider networkConfig={networkConfig}>{children}</WalletProvider>
    </DataProvider>
  ) : (
    <DataProvider key={key} networkConfig={networkConfig}>
      <RegisterGlobalEffects />
      <WalletProvider networkConfig={networkConfig}>{children}</WalletProvider>
    </DataProvider>
  )

  return (
    <>
      <ToastContainer theme={theme} toastClassName="border" />
      {dataProvider}
    </>
  )
}
