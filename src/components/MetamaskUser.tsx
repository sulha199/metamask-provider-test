import { FC, useEffect, useRef } from 'react'
import { KEY_ON_CHAIN_CHANGES } from '../consts'
import { useOnLoadValue } from '../hooks'
import { useEthereumAccount } from './MetamaskUser.hooks'

const NETWORK_VERSION_NAME_MAP: Record<string, string> = {
  '1': 'Ethereum Mainnet',
  '4': 'Rinkeby',
  '3': 'Ropsten',
}

export const getNetworkVersionName = (networkVersion: string | null) => {
  if (networkVersion == null) {
    return networkVersion
  }
  return NETWORK_VERSION_NAME_MAP[networkVersion] ?? `Network #${networkVersion}`
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
  const initialRender = useRef(true)

  // HTML
  const layoutInstalled = (
    <li>
      Metamask Extension Installation : <b>{extensionStatus}</b>{' '}
      {extensionStatus === 'none' && (
        <button className='button-primary' onClick={startOnboarding}>
          Install
        </button>
      )}
    </li>
  )
  const layoutNetwork = (
    <li>
      Network: <b>{getNetworkVersionName(networkVersion) ?? 'N/A'}</b>
    </li>
  )
  const layoutAddress = (
    <li>
      Connected Address: {selectedAddress ? <b>{selectedAddress}</b> : <i>{selectedAddressStatus} </i>}
      {selectedAddressStatus !== 'done' && extensionStatus === 'done' && (
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
      {layoutNetwork}
      {layoutAddress}
    </ol>
  )
}
