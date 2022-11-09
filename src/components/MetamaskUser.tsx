import { FC, useEffect } from 'react'
import { KEY_ON_CHAIN_CHANGES } from '../consts'
import { useOnLoadValue } from '../hooks'
import { useEthereumAccount } from './MetamaskUser.hooks'

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

  useEffect(() => {
    // only store value if window.ethereum?.selectedAddress,
    // otherwise it will cause the network version alert to show
    if (window.ethereum?.selectedAddress) {
      updateValue(networkVersion)
    }
  }, [networkVersion])

  return (
    <ol className='collection'>
      {layoutInstalled}
      {layoutAddress}
    </ol>
  )
}
