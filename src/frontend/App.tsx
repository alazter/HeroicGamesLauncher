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

// ✅ IMPORTANTE: importar o tipo correto
import type { HelpItem } from 'frontend/types'

// ✅ Contexto corrigido
interface HeroicAppContext {
  isRTL: boolean
  isFullscreen: boolean
  isFrameless: boolean
  experimentalFeatures: { enableHelp?: boolean }
  help: { items: Record<string, HelpItem> }
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
          --background: rgba(10, 10, 10, 0.4) !important;
          --background-darker: rgba(0, 0, 0, 0.6) !important;
        }
        body {
          background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("${globalBg}") !important;
          background-size: cover !important;
          background-position: center !important;
          background-attachment: fixed !important;
        }
        #app, .App, main.content, .sidebar-container, aside, nav {
          background-color: transparent !important;
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
            backgroundColor: globalBg
              ? 'rgba(30, 30, 30, 0.5)'
              : 'var(--background)'
          }
        }
      }
    }
  })

  return (
    <div
      id="app"
      className={classNames('App', {
        isRTL,
        frameless: isFrameless,
        fullscreen: isFullscreen,
        disableAnimations
      })}
      onDragStart={(e) => e.preventDefault()}
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
            <dialog className="simple-keyboard-wrapper">
              <div className="simple-keyboard"></div>
            </dialog>
          </div>

          {showOverlayControls && <WindowControls />}

          {/* ✅ Agora sem erro de tipo */}
          {experimentalFeatures?.enableHelp && (
            <Help items={help?.items || {}} />
          )}
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
      {
        index: true,
        lazy: makeLazyFunc(import('./screens/Library'))
      },
      {
        path: 'login',
        lazy: makeLazyFunc(import('./screens/Login'))
      },
      {
        path: 'store/:store',
        lazy: makeLazyFunc(import('./screens/WebView'))
      },
      {
        path: 'wiki',
        lazy: makeLazyFunc(import('./screens/WebView'))
      },
      {
        path: 'gamepage/:runner/:appName',
        lazy: makeLazyFunc(import('./screens/Game/GamePage'))
      },
      {
        path: 'store-page',
        lazy: makeLazyFunc(import('./screens/WebView'))
      },
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
