import MetaMaskOnboarding from '@metamask/onboarding'
import { JsonRpcError, Maybe } from '@metamask/types'
import { useCallback, useEffect, useState } from 'react'
import {
  ETH_CODE_PROCESSING,
  ETH_EVENT_ACCOUNTS_CHANGED,
  ETH_EVENT_CHAIN_CHANGED
} from '../consts'

export type Status = 'none' | 'waiting' | 'done'

const getAccounts = () => window.ethereum?.request<string[]>({ method: 'eth_requestAccounts' })
/** Return ` window.ethereum.networkVersion` or null */
const getNetworkVersion = () => window.ethereum?.networkVersion ?? null

const ONBOARDING = new MetaMaskOnboarding()
/** Value of 5 Minutes in miliseconds */
const EXTENSION_INSTALLATION_TIMEOUT = 1000 * 5 * 60

export const useEthereumExtension = () => {
  const onboarding = ONBOARDING
  const [extensionStatus, setExtensionStatus] = useState<Status>(
    MetaMaskOnboarding.isMetaMaskInstalled() ? 'done' : 'none'
  )

  const startOnboarding = () => {
    setExtensionStatus('waiting')
    onboarding.startOnboarding()
    // use timeout because onboarding API don't emit state if user stopped during onboarding/installation
    // timeout is to make the button install button appear again
    setTimeout(() => {
      if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
        setExtensionStatus('none')
      }
    }, EXTENSION_INSTALLATION_TIMEOUT)
  }

  return { onboarding, startOnboarding, extensionStatus }
}

export const useEthereumAccount = () => {
  const extension = useEthereumExtension()
  const { extensionStatus } = extension
  const [selectedAddressStatus, setSelectedAddressStatus] = useState<Status>('none')
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>()
  const [selectedAddressError, setSlectedAddressError] = useState<string | undefined>()
  const [networkVersion, setNetworkVersion] = useState<string | null>(getNetworkVersion())

  /**
   ** if `adresses == []` then `SelectedAddressStatus = none`
   ** if `adresses[0] != null` then `SelectedAddressStatus = done`
   ** if `adresses == null` then `SelectedAddressStatus = waiting`
   */
  const selectAddress = useCallback((adresses: Maybe<string[]>) => {
    const address = adresses?.[0]
    if (adresses !== null) {
      setSelectedAddressStatus(address ? 'done' : 'none')
    }
    setSelectedAddress(address)
  }, [])

  const onChainChanged = useCallback(() => {
    // use setTimeout to give time for networkVersion to be loaded
    setTimeout(() => {
      setNetworkVersion(getNetworkVersion())
      // reload windows as its suggested in https://docs.metamask.io/guide/ethereum-provider.html#chainchanged
      window.location.reload()
    })
  }, [])

  useEffect(() => {
    if (extensionStatus !== 'done') {
      return
    }

    getAccounts()
      ?.catch(({ message, code }: JsonRpcError) => {
        // please refers to `selectAddress()` params to define the return value
        if (code === ETH_CODE_PROCESSING) {
          setSelectedAddressStatus('waiting')
          return null
        }
        setSlectedAddressError(message)
        return []
      })
      .then(selectAddress)
    window.ethereum?.on(ETH_EVENT_ACCOUNTS_CHANGED, selectAddress)
    window.ethereum?.on(ETH_EVENT_CHAIN_CHANGED, onChainChanged)
    return () => {
      window.ethereum?.removeListener(ETH_EVENT_ACCOUNTS_CHANGED, selectAddress)
      window.ethereum?.removeListener(ETH_EVENT_CHAIN_CHANGED, onChainChanged)
    }
  }, [extensionStatus, selectAddress, onChainChanged])

  return { ...extension, selectedAddress, selectedAddressStatus, selectedAddressError, networkVersion }
}
