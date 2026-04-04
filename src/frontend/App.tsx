import React, { useContext, useState, useEffect } from 'react'
import './App.css'
import {
  createHashRouter,
  Navigate,
  Outlet,
  RouterProvider
} from 'react-router-dom'
import Sidebar from './components/UI/Sidebar'
import ContextProvider from './state/ContextProvider'
import { ControllerHints, Help, OfflineMessage } from './components/UI'
import DialogHandler from './components/UI/DialogHandler'
import ExternalLinkDialog from './components/UI/ExternalLinkDialog'
import WindowControls from './components/UI/WindowControls'
import classNames from 'classnames'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import LogFileUploadDialog from './components/UI/LogFileUploadDialog'
import UploadedLogFilesList from './screens/Settings/sections/LogSettings/components/UploadedLogFilesList'
import { TourProvider } from './state/TourContext'
import { InstallGameWrapper } from './screens/Library/components/InstallModal'
import { SettingsModalWrapper } from './screens/Settings/components/SettingsModal'
import AnalyticsDialog from './screens/Settings/components/AnalyticsDialog'

interface HeroicAppContext {
  isRTL: boolean
  isFullscreen: boolean
  isFrameless: boolean
  experimentalFeatures: { enableHelp?: boolean }
  help: { items: React.ComponentProps<typeof Help>['items'] }
  disableAnimations: boolean
}

function Root() {
  const context = useContext(ContextProvider) as unknown as HeroicAppContext

  const {
    isRTL,
    isFullscreen,
    isFrameless,
    experimentalFeatures,
    help,
    disableAnimations
  } = context

  const nav = navigator as unknown as Record<string, Record<string, boolean>>
  const hasNativeOverlayControls =
    typeof nav.windowControlsOverlay === 'object' &&
    nav.windowControlsOverlay.visible
  const showOverlayControls = isFrameless && !hasNativeOverlayControls

  const [globalBg, setGlobalBg] = useState<string | null>(() => {
    return localStorage.getItem('heroic_custom_bg')
  })

  useEffect(() => {
    const handleBgChange = () =>
      setGlobalBg(localStorage.getItem('heroic_custom_bg'))
    window.addEventListener('customBgChanged', handleBgChange)
    return () => window.removeEventListener('customBgChanged', handleBgChange)
  }, [])

  useEffect(() => {
    const styleId = 'custom-heroic-vars'
    let styleTag = document.getElementById(styleId) as HTMLStyleElement
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = styleId
      document.head.appendChild(styleTag)
    }

    if (globalBg) {
      styleTag.innerHTML = `
        :root {
          --background: transparent !important;
        }

        /* 1. FUNDO DO APP: A imagem do Marechal volta para cá */
        #app {
          background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("${globalBg}") !important;
          background-size: cover !important;
          background-position: center !important;
          background-attachment: fixed !important;
          background-repeat: no-repeat !important;
          background-color: #121212 !important;
        }

        /* 2. TRANSPARÊNCIA: Garante que a biblioteca e sidebar NÃO tenham cor sólida */
        .App, 
        main.content, 
        main.content > div,
        aside, 
        .sidebar-container,
        nav[class*="TitleBar"] {
          background-color: transparent !important;
          background: transparent !important;
          background-image: none !important;
        }

        /* 3. AS JANELAS (A SUA IDEIA): Cor sólida #131a20 apenas nos Modais e Menus */
        /* Usamos seletores bem específicos para não afetar o fundo principal */
        .MuiDialog-paper, 
        .MuiPaper-elevation24, 
        .MuiPopover-paper,
        [role="dialog"] {
          background-color: #131a20 !important;
          background: #131a20 !important;
          background-image: none !important;
          backdrop-filter: none !important;
          opacity: 1 !important;
        }
      `
    } else {
      styleTag.innerHTML = ''
    }
  }, [globalBg])

  const theme = createTheme({
    direction: isRTL ? 'rtl' : 'ltr',
    typography: { fontFamily: 'var(--primary-font-family)' },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            color: 'var(--text-default)',
            // Mantemos var(--background) no tema para não bugar a biblioteca
            backgroundColor: 'var(--background)'
          }
        }
      }
    }
  })

  const helpItems =
    help?.items || ({} as React.ComponentProps<typeof Help>['items'])

  return (
    <div
      id="app"
      className={classNames('App', {
        isRTL,
        frameless: isFrameless,
        fullscreen: isFullscreen,
        disableAnimations
      })}
    >
      <ThemeProvider theme={theme}>
        <TourProvider>
          <OfflineMessage />
          <Sidebar />
          <main className="content">
            <DialogHandler />
            <InstallGameWrapper />
            <SettingsModalWrapper />
            <ExternalLinkDialog />
            <LogFileUploadDialog />
            <UploadedLogFilesList />
            <Outlet />
            <AnalyticsDialog />
          </main>
          <div className="controller">
            <ControllerHints />
          </div>
          {showOverlayControls && <WindowControls />}
          {experimentalFeatures?.enableHelp && <Help items={helpItems} />}
        </TourProvider>
      </ThemeProvider>
    </div>
  )
}

function makeLazyFunc(
  importedFile: Promise<{
    default: React.ComponentType<Record<string, unknown>>
  }>
) {
  return async () => {
    const component = await importedFile
    return { Component: component.default }
  }
}

const router = createHashRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, lazy: makeLazyFunc(import('./screens/Library')) },
      { path: 'login', lazy: makeLazyFunc(import('./screens/Login')) },
      { path: 'store/:store', lazy: makeLazyFunc(import('./screens/WebView')) },
      { path: 'wiki', lazy: makeLazyFunc(import('./screens/WebView')) },
      {
        path: 'gamepage/:runner/:appName',
        lazy: makeLazyFunc(import('./screens/Game/GamePage'))
      },
      { path: 'store-page', lazy: makeLazyFunc(import('./screens/WebView')) },
      {
        path: 'loginweb/:runner',
        lazy: makeLazyFunc(import('./screens/WebView'))
      },
      {
        path: 'settings/:type',
        lazy: makeLazyFunc(import('./screens/Settings'))
      },
      {
        path: 'wine-manager',
        lazy: makeLazyFunc(import('./screens/WineManager'))
      },
      {
        path: 'download-manager',
        lazy: makeLazyFunc(import('./screens/DownloadManager'))
      },
      {
        path: 'accessibility',
        lazy: makeLazyFunc(import('./screens/Accessibility'))
      },
      {
        path: 'personalization',
        lazy: makeLazyFunc(import('./screens/Personalization'))
      },
      { path: '*', element: <Navigate replace to="/" /> }
    ]
  }
])

export default function App() {
  return <RouterProvider router={router} />
}
