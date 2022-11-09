import { FC, useEffect, useRef } from 'react'
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
  const initialRender = useRef(true)

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
    if (initialRender.current) {
      initialRender.current = false
    } else if (window.ethereum?.selectedAddress) {
      // only store value if selectedAddress != null and not initialRender,
      // otherwise it will cause the unnecessary networkVersion alert to show
      updateValue(networkVersion)
    }
  }, [networkVersion, updateValue])

  return (
    <ol className='collection'>
      {layoutInstalled}
      {layoutAddress}
    </ol>
  )
}
