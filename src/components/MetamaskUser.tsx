import MetaMaskOnboarding from '@metamask/onboarding'
import { JsonRpcError, Maybe } from '@metamask/types'
import { FC, useCallback, useEffect, useState } from 'react'
import {
  ETH_CODE_PROCESSING,
  ETH_EVENT_ACCOUNTS_CHANGED,
  ETH_EVENT_CHAIN_CHANGED,
  KEY_ON_CHAIN_CHANGES,
} from '../consts'
import { useOnLoadValue } from '../hooks'

type Status = 'none' | 'waiting' | 'done'

const getAccounts = () => window.ethereum?.request<string[]>({ method: 'eth_requestAccounts' })

const ONBOARDING = new MetaMaskOnboarding()
/** Value of 5 Minutes in miliseconds */
const EXTENSION_INSTALLATION_TIMEOUT = 1000 * 5 * 60

const useEthereumExtension = () => {
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

const useEthereumAccount = () => {
  const extension = useEthereumExtension()
  const { extensionStatus } = extension
  const [selectedAddressStatus, setSelectedAddressStatus] = useState<Status>('none')
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>()
  const [selectedAddressError, setSlectedAddressError] = useState<string | undefined>()
  const [networkVersion, setNetworkVersion] = useState<string | null>(window.ethereum?.networkVersion ?? null)

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
    setTimeout(() => {
      setNetworkVersion(window.ethereum?.networkVersion ?? null)
      window.location.reload()
    })
  }, [])

  useEffect(() => {
    if (extensionStatus !== 'done') {
      return
    }

    getAccounts()
      ?.catch(({ message, code }: JsonRpcError) => {
        // return value refers to `selectAddress()` params
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

export const MetamaskUser: FC = () => {
  const {
    extensionStatus,
    selectedAddress,
    startOnboarding,
    selectedAddressStatus,
    selectedAddressError,
    networkVersion,
  } = useEthereumAccount()

  const { updateValue } = useOnLoadValue(KEY_ON_CHAIN_CHANGES)

  useEffect(() => {
    updateValue(networkVersion)
  }, [networkVersion, updateValue])

  // HTML
  const layoutInstalled = (
    <li className='collection-item'>
      Metamask Extension Installation : <b>{extensionStatus}</b>{' '}
      {extensionStatus === 'none' && (
        <button className='button-primary' onClick={startOnboarding}>
          Install
        </button>
      )}
    </li>
  )
  const layoutAddress = (
    <li className='collection-item'>
      Connected Address: {selectedAddress ? <b>{selectedAddress}</b> : <i>{selectedAddressStatus} </i>}
      {selectedAddressStatus !== 'done' && (
        <blockquote>
          {selectedAddressError ?? <>Please Login to Metamask and add this site to Connected Sites</>}
        </blockquote>
      )}
    </li>
  )

  return (
    <ol className='collection'>
      {layoutInstalled}
      {layoutAddress}
    </ol>
  )
}
