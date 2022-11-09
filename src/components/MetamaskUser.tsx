import MetaMaskOnboarding from '@metamask/onboarding'
import { JsonRpcError, Maybe } from '@metamask/types'
import { FC, useEffect, useRef, useState } from 'react'
import { ETH_CODE_PROCESSING, ETH_EVENT_ACCOUNTS_CHANGED, ETH_EVENT_CHAIN_CHANGED } from '../consts'

type Status = 'none' | 'processing' | 'done'

// function getLibrary(provider: ConstructorParameters<typeof Web3Provider>['0']): Web3Provider {
//   const library = new Web3Provider(provider)
//   library.pollingInterval = 12000
//   return library
// }

const getAccount = () => window.ethereum?.request<string[]>({ method: 'eth_requestAccounts' })

const ONBOARDING = new MetaMaskOnboarding()
/** 5 Minutes */
const EXTENSION_INSTALLATION_TIMEOUT = 1000 * 5 * 60

const useEthereumExtension = () => {
  const onboarding = ONBOARDING
  const [extensionStatus, setExtensionStatus] = useState<Status>(
    MetaMaskOnboarding.isMetaMaskInstalled() ? 'done' : 'none'
  )

  const startOnboarding = () => {
    setExtensionStatus('processing')
    onboarding.startOnboarding()
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

  const { current: selectAddress } = useRef((adresses: Maybe<string[]>) => {
    console.log(adresses)
    setSelectedAddress(adresses?.[0])
    setSelectedAddressStatus(adresses?.[0] ? 'done' : 'none')
  })

  const { current: onChainChanged } = useRef((chainId: string) => {
    window.location.reload()
  })

  useEffect(() => {
    if (extensionStatus !== 'done') {
      return
    }

    getAccount()
      ?.catch(({ message, code }: JsonRpcError) => {
        if (code === ETH_CODE_PROCESSING) {
          setSelectedAddressStatus('processing')
          return null
        }
        setSlectedAddressError(message)
        return null
      })
      .then(selectAddress)
    window.ethereum?.on(ETH_EVENT_ACCOUNTS_CHANGED, selectAddress)
    window.ethereum?.on(ETH_EVENT_CHAIN_CHANGED, onChainChanged)
    return () => {
      window.ethereum?.removeListener(ETH_EVENT_ACCOUNTS_CHANGED, selectAddress)
      window.ethereum?.removeListener(ETH_EVENT_CHAIN_CHANGED, onChainChanged)
    }
  }, [extensionStatus, selectAddress, onChainChanged])

  return { ...extension, selectedAddress, selectedAddressStatus, selectedAddressError }
}

export const MetamaskUser: FC = () => {
  const { extensionStatus, selectedAddress, startOnboarding, selectedAddressStatus, selectedAddressError } =
    useEthereumAccount()

  // layout
  const layoutInstalled = (
    <li className='collection-item'>
      Metamask Extension Installation : <b>{extensionStatus}</b>{' '}
      {extensionStatus === 'none' && (
        <button className='waves-effect waves-light btn' onClick={startOnboarding}>
          Install
        </button>
      )}
    </li>
  )
  const layoutAddress = (
    <li className='collection-item'>
      Connected Address: {selectedAddress ? <b>{selectedAddress}</b> : <i>{selectedAddressStatus} </i>}
      {selectedAddressStatus === 'none' && (
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
