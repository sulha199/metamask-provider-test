import './App.css'
import { getNetworkVersionName, MetamaskUser } from './components/MetamaskUser'
import { KEY_ON_CHAIN_CHANGES } from './consts'
import { useOnLoadValue } from './hooks'

function App() {
  const { value: networkVersion } = useOnLoadValue(KEY_ON_CHAIN_CHANGES)

  return (
    <section>
      <div className='container'>
        {networkVersion && <div className='alert alert-info'>Switched to {getNetworkVersionName(networkVersion)}</div>}
        <MetamaskUser />
      </div>
    </section>
  )
}

export default App
