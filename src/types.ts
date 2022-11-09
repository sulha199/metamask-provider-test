import { BaseProvider } from '@metamask/providers'

export type EthereumWindow = {
    selectedAddress: string
    networkVersion: string
    request: (param: any) => Promise<any>
    on: Function
}

declare global {
  interface Window { ethereum?: BaseProvider }
}
