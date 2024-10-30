import { createRoot } from 'react-dom/client'
import { ArweaveWalletKit } from '@arweave-wallet-kit-beta/react'
import ArConnectStrategy from '@arweave-wallet-kit-beta/arconnect-strategy'
import BrowserWalletStrategy from '@arweave-wallet-kit-beta/browser-wallet-strategy'

import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <ArweaveWalletKit
      config={{
        strategies: [new ArConnectStrategy(), new BrowserWalletStrategy()],
        permissions: [
          "ACCESS_ADDRESS",
          "SIGN_TRANSACTION",
          "ACCESS_PUBLIC_KEY",
          "SIGNATURE",
          "DISPATCH",
        ],
        ensurePermissions: true,
      }}
      theme={{
        displayTheme: "light",
      }}
    >
      <App />
    </ArweaveWalletKit>
)
