import './index.scss'
import short from 'short-uuid'
import {
  faSpinner,
  faSearch,
  faPlay,
  faCog,
  faTimes,
  faTrash,
  faCheck,
  faBan,
  faFileAlt,
  faSyncAlt
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { InstallPlatform, WineInstallation, GameInfo, GameCandidate } from 'common/types'
import {
  CachedImage,
  TextInputField,
  PathSelectionBox,
  ToggleSwitch,
  InfoBox,
  SteamGridDBPicker,
  WarningMessage
} from 'frontend/components/UI'
import { DialogContent } from 'frontend/components/UI/Dialog'
import {
  getGameInfo,
  getGameSettings,
  removeSpecialcharacters,
  writeConfig
} from 'frontend/helpers'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { AvailablePlatforms } from '..'
import fallbackImage from 'frontend/assets/heroic_card.jpg'
import ContextProvider from 'frontend/state/ContextProvider'
import classNames from 'classnames'
import axios from 'axios'
import { NavLink, useNavigate } from 'react-router-dom'
import TextInputWithIconField from 'frontend/components/UI/TextInputWithIconField'
import Folder from '@mui/icons-material/Folder'

type Props = {
  availablePlatforms: AvailablePlatforms
  winePrefix: string
  crossoverBottle: string
  wineVersion: WineInstallation | undefined
  setWinePrefix: React.Dispatch<React.SetStateAction<string>>
  children: React.ReactNode
  platformToInstall: InstallPlatform
  backdropClick: () => void
  appName?: string
  initialSgdbTarget?: 'cover' | 'square' | null
}

export default function SideloadDialog({
  availablePlatforms,
  backdropClick,
  winePrefix,
  crossoverBottle,
  wineVersion,
  platformToInstall,
  setWinePrefix,
  children,
  appName,
  initialSgdbTarget = null
}: Props) {
  const { t, i18n } = useTranslation('gamepage')
  const [title, setTitle] = useState<string>(t('sideload.field.title', 'Title'))
  const [selectedExe, setSelectedExe] = useState('')
  const [gameUrl, setGameUrl] = useState('')
  const [customUserAgent, setCustomUserAgent] = useState('')
  const [launchFullScreen, setLaunchFullScreen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [heroUrl, setHeroUrl] = useState('')
  const [searching, setSearching] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [app_name, setApp_name] = useState(appName ?? '')
  const [runningSetup, setRunningSetup] = useState(false)
  const [gameInfo, setGameInfo] = useState<Partial<GameInfo>>({})
  const [addingApp, setAddingApp] = useState(false)
  const [sgdbTarget, setSgdbTarget] = useState<'cover' | 'square' | null>(
    initialSgdbTarget
  )
  const [hasSgdbKey, setHasSgdbKey] = useState(false)
  const editMode = Boolean(appName)

  const { refreshLibrary, platform, showDialogModal } = useContext(ContextProvider)
  const navigate = useNavigate()
  const goToAdvancedSettings = () => {
    backdropClick()
    navigate('/settings/advanced')
  }

  // Active tab state: 'manual' or 'scanner'
  const [activeTab, setActiveTab] = useState<'manual' | 'scanner'>('manual')

  // Auto-scanner states
  const [scannedCandidates, setScannedCandidates] = useState<GameCandidate[]>([])
  const [scanningCandidates, setScanningCandidates] = useState(false)
  const [importSelection, setImportSelection] = useState<Record<string, 'import' | 'blacklist' | 'none'>>({})
  const [blacklistCount, setBlacklistCount] = useState(0)
  const [scannedImports, setScannedImports] = useState<GameCandidate[]>([])
  const [scannedBlacklist, setScannedBlacklist] = useState<GameCandidate[]>([])

  function handleTitle(value: string) {
    value = removeSpecialcharacters(value)
    setTitle(value)
  }

  const appPlatform = gameInfo.install?.platform || platformToInstall

  useEffect(() => {
    window.api.steamgriddb.hasApiKey().then(setHasSgdbKey)
    window.api.getBlacklist().then((list) => setBlacklistCount(list.length))

    if (appName) {
      void getGameInfo(appName, 'sideload').then((info) => {
        if (!info || info.runner !== 'sideload') {
          return
        }
        setGameInfo(info)
        const {
          art_cover,
          art_square,
          install: { executable, platform },
          title,
          browserUrl,
          customUserAgent,
          launchFullScreen
        } = info

        if (executable && platform) {
          setSelectedExe(executable)
        }

        if (browserUrl) {
          setGameUrl(browserUrl)
        }

        if (customUserAgent) {
          setCustomUserAgent(customUserAgent)
        }

        if (launchFullScreen !== undefined) {
          setLaunchFullScreen(launchFullScreen)
        }

        setTitle(title)
        setImageUrl(art_square || '')
        setHeroUrl(art_cover && art_cover !== art_square ? art_cover : '')
      })
    } else {
      setApp_name(short.generate().toString())
    }
  }, [])

  // Suggest default Wine prefix if we're adding a new app
  useEffect(() => {
    if (editMode) return
    window.api.requestAppSettings().then(({ defaultWinePrefixDir }) => {
      const suggestedWinePrefix = `${defaultWinePrefixDir}/${title}`
      setWinePrefix(suggestedWinePrefix)
    })
  }, [title, editMode])

  async function searchImage() {
    if (hasSgdbKey) {
      setSgdbTarget('square')
      return
    }
    setSearching(true)

    try {
      const response = await axios.get(
        `https://steamgrid.usebottles.com/api/search/${title}`,
        { timeout: 3500 }
      )

      if (response.status === 200) {
        const steamGridImage = response.data as string

        if (steamGridImage && steamGridImage.startsWith('http')) {
          setImageUrl(steamGridImage)
        }
      } else {
        throw new Error('Fetch failed')
      }
    } catch (error) {
      window.api.logError(`${error}`)
    } finally {
      setSearching(false)
    }
  }

  async function handleSelectLocalImage(target: 'cover' | 'square') {
    const path = await window.api.openDialog({
      buttonLabel: t('box.select.button', 'Select'),
      properties: ['openFile'],
      title: t('box.select.image', 'Select Image'),
      filters: [
        {
          name: 'Images',
          extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']
        },
        { name: 'All', extensions: ['*'] }
      ]
    })

    if (!path) return
    if (target === 'cover') setHeroUrl(`file://${path}`)
    else setImageUrl(`file://${path}`)
  }

  async function handleInstall(): Promise<void> {
    setAddingApp(true)
    window.api.addNewApp({
      runner: 'sideload',
      app_name,
      title,
      install: {
        executable: selectedExe,
        platform: gameInfo.install?.platform ?? platformToInstall
      },
      art_cover: heroUrl || imageUrl || fallbackImage,
      is_installed: true,
      art_square: imageUrl || heroUrl || fallbackImage,
      canRunOffline: true,
      browserUrl: gameUrl,
      customUserAgent,
      launchFullScreen
    })
    const gameSettings = await getGameSettings(app_name, 'sideload')
    if (!gameSettings) {
      return
    }
    if (!editMode)
      window.api.writeConfig({
        appName: app_name,
        config: {
          ...gameSettings,
          winePrefix,
          wineVersion,
          wineCrossoverBottle: crossoverBottle
        }
      })

    await refreshLibrary({
      library: 'sideload',
      runInBackground: true,
      checkForUpdates: true
    })
    setAddingApp(false)
    return backdropClick()
  }

  const fileFilters = useCallback((platform: InstallPlatform) => {
    switch (platform) {
      case 'Windows':
      case 'windows':
      case 'Win32':
        return [
          { name: 'Executables', extensions: ['exe', 'msi'] },
          { name: 'Scripts', extensions: ['bat'] },
          { name: 'All', extensions: ['*'] }
        ]
      case 'linux':
        return [
          { name: 'AppImages', extensions: ['AppImage'] },
          { name: 'Other Binaries', extensions: ['sh', 'py', 'bin'] },
          { name: 'All', extensions: ['*'] }
        ]
      case 'osx':
      case 'Mac':
        return [
          { name: 'Apps', extensions: ['App'] },
          { name: 'Other Binaries', extensions: ['sh', 'py', 'bin'] },
          { name: 'All', extensions: ['*'] }
        ]
      case 'Android':
      case 'iOS':
      case 'Browser':
        return []
    }
  }, [])

  const handleRunExe = async () => {
    let exeToRun = ''
    const path = await window.api.openDialog({
      buttonLabel: t('box.select.button', 'Select'),
      properties: ['openFile'],
      title: t('box.runexe.title', 'Select EXE to Run'),
      filters: fileFilters(appPlatform)
    })
    if (path) {
      exeToRun = path
      try {
        setRunningSetup(true)
        const gameSettings = await getGameSettings(app_name, 'sideload')
        if (!gameSettings) {
          return
        }
        await writeConfig({
          appName: app_name,
          config: { ...gameSettings, winePrefix, wineVersion }
        })
        await window.api.runWineCommand({
          commandParts: [exeToRun],
          wait: true,
          protonVerb: 'runinprefix',
          gameSettings: {
            ...gameSettings,
            winePrefix,
            wineVersion: wineVersion || gameSettings.wineVersion
          }
        })
        setRunningSetup(false)
      } catch (error) {
        console.log('finished with error', error)
        setRunningSetup(false)
      }
    }
    return
  }

  function handleGameUrl(url: string) {
    if (!url.startsWith('https://')) {
      return setGameUrl(`https://${url}`)
    }

    setGameUrl(url)
  }

  function platformIcon() {
    const pIcon = availablePlatforms.filter(
      (p) => p.name === appPlatform.replace('Mac', 'macOS')
    )[0]?.icon

    if (!pIcon) return null

    return (
      <FontAwesomeIcon
        className="InstallModal__platformIcon"
        icon={pIcon}
      />
    )
  }

  const showSideloadExe = appPlatform !== 'Browser'

  const shouldShowRunExe =
    platform !== 'win32' &&
    appPlatform !== 'Mac' &&
    appPlatform !== 'linux' &&
    appPlatform !== 'Browser'

  // Auto-scanner functions
  const handleScanCandidates = async () => {
    setScanningCandidates(true)
    try {
      const results = await window.api.discoverInstalledGames()
      setScannedCandidates(results)

      const initialSelection: Record<string, 'import' | 'blacklist' | 'none'> = {}
      results.forEach((c) => {
        initialSelection[c.executable] = 'import'
      })
      setImportSelection(initialSelection)
      setScannedImports(results)
      setScannedBlacklist([])
    } catch (err) {
      window.api.logError(`Error discovering games: ${err}`)
    } finally {
      setScanningCandidates(false)
    }
  }

  const handleToggleSelection = (executable: string, target: 'import' | 'blacklist') => {
    setImportSelection((prev) => {
      const current = prev[executable] || 'none'
      let next: 'import' | 'blacklist' | 'none' = 'none'

      if (target === 'import') {
        next = current === 'import' ? 'none' : 'import'
      } else {
        next = current === 'blacklist' ? 'none' : 'blacklist'
      }

      const newSelection = { ...prev, [executable]: next }

      const toImport: GameCandidate[] = []
      const toBlacklist: GameCandidate[] = []

      scannedCandidates.forEach((c) => {
        const sel = newSelection[c.executable] || 'none'
        if (sel === 'import') {
          toImport.push(c)
        } else if (sel === 'blacklist') {
          toBlacklist.push(c)
        }
      })

      setScannedImports(toImport)
      setScannedBlacklist(toBlacklist)

      return newSelection
    })
  }

  const handleExportLog = async () => {
    const dateStr = new Date().toLocaleString()
    let logText = `Heroic Game Scanner Log - ${dateStr}\n`
    logText += `========================================\n\n`
    logText += `Jogos Escaneados: ${scannedCandidates.length}\n`
    logText += `Jogos Selecionados para Importar: ${scannedImports.length}\n`
    logText += `Jogos Selecionados para Blacklist: ${scannedBlacklist.length}\n\n`

    logText += `--- LISTA DE IMPORTAÇÃO ---\n`
    if (scannedImports.length === 0) {
      logText += `(Nenhum jogo selecionado para importação)\n`
    } else {
      scannedImports.forEach((g) => {
        logText += `- Título: ${g.title}\n  Executável: ${g.executable}\n`
      })
    }
    logText += `\n`

    logText += `--- LISTA NEGRA (BLACKLIST) ---\n`
    if (scannedBlacklist.length === 0) {
      logText += `(Nenhum jogo selecionado para blacklist)\n`
    } else {
      scannedBlacklist.forEach((g) => {
        logText += `- Título: ${g.title}\n  Executável: ${g.executable}\n`
      })
    }
    logText += `\n========================================\n`

    await window.api.exportScanLog(logText)
  }

  const handleClearBlacklist = async () => {
    await window.api.clearBlacklist()
    setBlacklistCount(0)
  }

  const handleImportSelectedGames = async () => {
    setAddingApp(true)
    try {
      const gamesToImport = scannedCandidates.filter(
        (c) => importSelection[c.executable] === 'import'
      )
      const gamesToBlacklist = scannedCandidates.filter(
        (c) => importSelection[c.executable] === 'blacklist'
      )

      await window.api.importSelectedGames({
        gamesToImport,
        gamesToBlacklist
      })

      const list = await window.api.getBlacklist()
      setBlacklistCount(list.length)

      await refreshLibrary({
        library: 'sideload',
        runInBackground: true,
        checkForUpdates: true
      })
      backdropClick()
    } catch (err) {
      window.api.logError(`Error importing games: ${err}`)
    } finally {
      setAddingApp(false)
    }
  }

  const handleDeleteApp = () => {
    if (!appName) return
    showDialogModal({
      title: t('button.uninstall', 'Uninstall'),
      message: `Tem certeza de que deseja remover/desinstalar "${title}"?`,
      buttons: [
        {
          text: 'Cancelar',
          onClick: () => null
        },
        {
          text: 'Remover',
          onClick: async () => {
            setAddingApp(true)
            try {
              await window.api.bulkUninstall([{ appName, runner: 'sideload' }], true, true)
              await refreshLibrary({
                library: 'sideload',
                runInBackground: true,
                checkForUpdates: true
              })
              backdropClick()
            } catch (err) {
              window.api.logError(`Error deleting app ${appName}: ${err}`)
            } finally {
              setAddingApp(false)
            }
          }
        }
      ]
    })
  }

  const sectionHeaderStyle = {
    fontFamily: 'var(--secondary-font-family)',
    fontSize: '15px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '6px'
  }

  return (
    <DialogContent className="sideloadDialogContent">
      <div className="sideloadGrid">
        {/* Simulated HeroPanel (left panel) */}
        <div className="simulated-hero-panel">
          {/* Capa Vertical */}
          <div
            className={classNames('appImageContainer', {
              hasSgdbKey,
              searching,
              loading: imageLoading
            })}
            style={{
              position: 'relative',
              cursor: 'pointer',
              borderBottomLeftRadius: '0px',
              borderBottomRightRadius: '0px',
              width: 'calc(100% + 30px)',
              height: '320px',
              marginTop: '-15px',
              marginLeft: '-15px',
              marginRight: '-15px',
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              transition: 'all 0.2s ease',
              marginBottom: 0
            }}
            onClick={() => (hasSgdbKey ? setSgdbTarget('square') : handleSelectLocalImage('square'))}
          >
            <CachedImage
              className={classNames('appImage', {
                blackWhiteImage: searching
              })}
              src={imageUrl ? imageUrl : fallbackImage}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
            {(searching || imageLoading) && (
              <div className="imageLoadingOverlay">
                <FontAwesomeIcon icon={faSpinner} spin size="3x" />
              </div>
            )}
            {hasSgdbKey && !searching && !imageLoading && (
              <div className="imageHoverOverlay">
                <FontAwesomeIcon icon={faSearch} size="3x" />
              </div>
            )}
          </div>

          {/* Title & Info */}
          <div style={{ flex: 1, padding: '10px 0 0 0', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#fff', textAlign: 'center', wordBreak: 'break-word', maxWidth: '100%' }}>
              {title || 'Novo Jogo'}
            </h3>

            {/* Action Row */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.7)'
              }} title={appPlatform}>
                {platformIcon()}
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('manual')
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: activeTab === 'manual' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeTab === 'manual' ? '#00e5ff' : 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer'
                }}
                title={t('button.settings', 'Configurações')}
              >
                <FontAwesomeIcon icon={faCog} />
              </button>

              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: addingApp ? 'rgba(0, 229, 255, 0.1)' : 'rgba(0, 229, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00e5ff'
              }}>
                <FontAwesomeIcon icon={addingApp ? faSpinner : faPlay} spin={addingApp} />
              </div>
            </div>

            {/* Simulated stats */}
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', marginTop: '6px' }}>
              <div>{editMode ? 'Tempo de jogo: Nunca' : 'Novo Jogo / Sideload'}</div>
              {editMode && <div style={{ marginTop: '2px' }}>Jogado pela última vez: Nunca</div>}
            </div>

            {/* Divider */}
            <div style={{ width: '100%', height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

            {/* Links Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              width: '100%',
              fontSize: '13px'
            }}>
              <div>
                <button
                  type="button"
                  className="hero-mock-link"
                  onClick={() => {
                    setActiveTab('scanner')
                    if (scannedCandidates.length === 0) {
                      handleScanCandidates()
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faSyncAlt} style={{ width: '14px' }} />
                  Escanear PC
                </button>
                {blacklistCount > 0 && (
                  <button
                    type="button"
                    className="hero-mock-link"
                    style={{ color: '#ff4444' }}
                    onClick={handleClearBlacklist}
                  >
                    <FontAwesomeIcon icon={faBan} style={{ width: '14px' }} />
                    Limpar Blacklist
                  </button>
                )}
                <button
                  type="button"
                  className="hero-mock-link"
                  onClick={goToAdvancedSettings}
                >
                  <FontAwesomeIcon icon={faCog} style={{ width: '14px' }} />
                  Conf. Globais
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className="hero-mock-link"
                  onClick={() => window.api.openExternalUrl('https://github.com/Heroic-Games-Launcher/HeroicGamesLauncher/wiki')}
                >
                  <FontAwesomeIcon icon={faFileAlt} style={{ width: '14px' }} />
                  Wiki / Ajuda
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right simulated Settings Panel */}
        <div className="simulated-settings-panel">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                {editMode ? `${title} (Configurações)` : t('sideload.add_title', 'Adicionar Jogo')}
              </h2>
              {editMode && (
                <button
                  type="button"
                  onClick={handleDeleteApp}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ff4444',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  title={t('button.delete', 'Excluir Jogo')}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={backdropClick}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* SteamGridDB Picker Mode */}
          {sgdbTarget ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <SteamGridDBPicker
                initialTitle={title}
                mode={sgdbTarget === 'cover' ? 'heroes' : 'grids'}
                hideCloseButton={!!initialSgdbTarget}
                onClose={() => setSgdbTarget(null)}
                onSelect={(url: string) => {
                  if (sgdbTarget === 'cover') {
                    setHeroUrl(url)
                  } else if (url !== imageUrl) {
                    setImageLoading(true)
                    setImageUrl(url)
                  }
                  setSgdbTarget(null)
                }}
              />
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '4px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'manual' ? '2px solid #00e5ff' : '2px solid transparent',
                    color: activeTab === 'manual' ? '#00e5ff' : 'rgba(255, 255, 255, 0.4)',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                >
                  {editMode ? t('button.settings', 'Configurações') : t('button.add_manual', 'Adicionar Manual')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('scanner')
                    if (scannedCandidates.length === 0) {
                      handleScanCandidates()
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'scanner' ? '2px solid #00e5ff' : '2px solid transparent',
                    color: activeTab === 'scanner' ? '#00e5ff' : 'rgba(255, 255, 255, 0.4)',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                >
                  {t('button.auto_scanner', 'Auto-Scanner')}
                </button>
              </div>

              {/* Scrollable Content Form */}
              <div className="sideloadForm">
                {activeTab === 'manual' ? (
                  <>
                    {/* Secao 1: Titulo e Imagens */}
                    <div>
                      <div style={sectionHeaderStyle}>
                        1. {t('sideload.section.info', 'Informações Gerais')}
                      </div>
                      <TextInputField
                        label={t('sideload.info.title', 'Game/App Title')}
                        placeholder={t(
                          'sideload.placeholder.title',
                          'Add a title to your Game/App'
                        )}
                        onChange={(newValue) => handleTitle(newValue)}
                        onBlur={async () => searchImage()}
                        htmlId="sideload-title"
                        value={title}
                        maxLength={40}
                      />
                      <details className="advancedFields" style={{ marginTop: '12px' }}>
                        <summary
                          onClick={(e) => {
                            if (hasSgdbKey) {
                              e.preventDefault()
                              setSgdbTarget('square')
                            }
                          }}
                          style={{ color: '#00e5ff', fontWeight: '600', cursor: 'pointer' }}
                        >
                          {t('sideload.images.summary', 'Customizar Imagens de Capa')}
                        </summary>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                          <TextInputWithIconField
                            label={t(
                              'sideload.info.image-hint',
                              'Square Art (click on the image to search on SteamGridDB)'
                            )}
                            placeholder={t(
                              'sideload.placeholder.image',
                              'Paste an URL of an Image or select one from your computer'
                            )}
                            onChange={(newValue: string) => setImageUrl(newValue)}
                            htmlId="sideload-image"
                            value={imageUrl}
                            icon={<Folder />}
                            onIconClick={() => handleSelectLocalImage('square')}
                          />
                          <TextInputWithIconField
                            label={t(
                              'sideload.info.cover-hint',
                              'Cover/Hero Art (click on the image to search on SteamGridDB)'
                            )}
                            placeholder={t(
                              'sideload.placeholder.image',
                              'Paste an URL of an Image or select one from your computer'
                            )}
                            onChange={(newValue: string) => setHeroUrl(newValue)}
                            htmlId="sideload-cover"
                            value={heroUrl}
                            icon={<Folder />}
                            onIconClick={() => handleSelectLocalImage('cover')}
                          />
                        </div>
                      </details>
                      {!hasSgdbKey && (
                        <div style={{ marginTop: '12px' }}>
                          <WarningMessage>
                            {t(
                              'edit-game.sgdb.no-key-prefix',
                              'To search SteamGridDB for cover art, add an API key in'
                            )}{' '}
                            <a
                              role="button"
                              tabIndex={0}
                              onClick={goToAdvancedSettings}
                              className="sgdbWarningLink"
                            >
                              {t('edit-game.sgdb.no-key-link', 'Settings → Advanced')}
                            </a>
                            .
                          </WarningMessage>
                        </div>
                      )}
                    </div>

                    {/* Secao 2: Executavel / URL do jogo */}
                    <div>
                      <div style={sectionHeaderStyle}>
                        2. {t('sideload.section.path', 'Caminho do Jogo')}
                      </div>

                      {showSideloadExe && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '-10px' }}>
                            <label htmlFor="sideload-exe" style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                              {t('sideload.info.exe', 'Select Executable')}
                            </label>
                            <InfoBox
                              text={t(
                                'sideload.import-hint.title',
                                'Important! Are you adding a game from Epic/GOG/Amazon? Click here!'
                              )}
                            >
                              <div className="sideloadImportHint">
                                <Trans i18n={i18n} ns="gamepage" i18nKey="sideload.import-hint.content">
                                  Do NOT use this feature for that.
                                  <br />
                                  Instead, <NavLink to={'/login'}>log into</NavLink> the
                                  store, look for the game in your library, open the
                                  installation dialog, and click the &quot;Import Game&quot;
                                  button
                                </Trans>
                              </div>
                            </InfoBox>
                          </div>
                          <PathSelectionBox
                            type="file"
                            onPathChange={setSelectedExe}
                            path={selectedExe}
                            placeholder={t('sideload.info.exe', 'Select Executable')}
                            pathDialogTitle={t('box.sideload.exe', 'Select Executable')}
                            pathDialogDefaultPath={winePrefix}
                            pathDialogFilters={fileFilters(platformToInstall)}
                            htmlId="sideload-exe"
                            noDeleteButton
                          />
                        </div>
                      )}

                      {!showSideloadExe && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <TextInputField
                            label={t('sideload.info.broser', 'BrowserURL')}
                            placeholder={t(
                              'sideload.placeholder.url',
                              'Paste the Game URL here'
                            )}
                            onChange={(newValue: string) => handleGameUrl(newValue)}
                            htmlId="sideload-game-url"
                            value={gameUrl}
                          />
                          <TextInputField
                            label={t('sideload.info.useragent', 'Custom User Agent')}
                            placeholder={t(
                              'sideload.placeholder.useragent',
                              'Write a custom user agent here to be used on this browser app/game'
                            )}
                            onChange={(newValue: string) => setCustomUserAgent(newValue)}
                            htmlId="sideload-user-agent"
                            value={customUserAgent}
                          />
                          <ToggleSwitch
                            htmlId="launch-fullscreen"
                            value={launchFullScreen}
                            handleChange={() => setLaunchFullScreen(!launchFullScreen)}
                            title={t(
                              'sideload.info.fullscreen',
                              'Launch Fullscreen (F11 to exit)'
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Secao 3: Plataforma & Wine (children) */}
                    {!editMode && children && (
                      <div>
                        <div style={sectionHeaderStyle}>
                          3. {t('sideload.section.wine', 'Runner e Configurações')}
                        </div>
                        {children}
                      </div>
                    )}
                  </>
                ) : (
                  /* AUTO-SCANNER TAB CONTENT */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {scannedCandidates.length > 0
                          ? `Encontrado(s) ${scannedCandidates.length} jogo(s) candidatos.`
                          : 'Use o scanner para procurar jogos instalados no seu PC.'}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {blacklistCount > 0 && (
                          <button
                            type="button"
                            onClick={handleClearBlacklist}
                            className="button is-danger is-outlined"
                            style={{ padding: '4px 12px', fontSize: '12px', height: '32px' }}
                          >
                            Limpar Blacklist ({blacklistCount})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleScanCandidates}
                          className="button is-secondary"
                          style={{ padding: '4px 12px', fontSize: '12px', height: '32px' }}
                          disabled={scanningCandidates}
                        >
                          {scanningCandidates ? (
                            <>
                              <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '6px' }} />
                              Escaneando...
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faSyncAlt} style={{ marginRight: '6px' }} />
                              Escanear PC
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {scanningCandidates && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '12px', flex: 1 }}>
                        <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00e5ff' }} />
                        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                          Escaneando o registro do Windows por executáveis de jogos...
                        </span>
                      </div>
                    )}

                    {!scanningCandidates && scannedCandidates.length === 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px dashed rgba(255, 255, 255, 0.1)', flex: 1 }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
                          Nenhum candidato encontrado. Clique em &quot;Escanear PC&quot; acima.
                        </span>
                      </div>
                    )}

                    {!scanningCandidates && scannedCandidates.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
                        {scannedCandidates.map((c) => {
                          const selection = importSelection[c.executable] || 'none'
                          return (
                            <div
                              key={c.executable}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 12px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <img
                                src={c.art_square || fallbackImage}
                                alt={c.title}
                                style={{ width: '40px', height: '54px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {c.title}
                                </div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={c.executable}>
                                  {c.executable}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <label style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  background: selection === 'import' ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255,255,255,0.02)',
                                  border: `1px solid ${selection === 'import' ? '#00e5ff' : 'rgba(255,255,255,0.1)'}`,
                                  color: selection === 'import' ? '#00e5ff' : 'rgba(255, 255, 255, 0.6)',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  userSelect: 'none',
                                  transition: 'all 0.2s ease'
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={selection === 'import'}
                                    onChange={() => handleToggleSelection(c.executable, 'import')}
                                    style={{ display: 'none' }}
                                  />
                                  <FontAwesomeIcon icon={faCheck} style={{ width: '12px', opacity: selection === 'import' ? 1 : 0.3 }} />
                                  Importar
                                </label>

                                <label style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  background: selection === 'blacklist' ? 'rgba(255, 68, 68, 0.12)' : 'rgba(255,255,255,0.02)',
                                  border: `1px solid ${selection === 'blacklist' ? '#ff4444' : 'rgba(255,255,255,0.1)'}`,
                                  color: selection === 'blacklist' ? '#ff4444' : 'rgba(255, 255, 255, 0.6)',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  userSelect: 'none',
                                  transition: 'all 0.2s ease'
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={selection === 'blacklist'}
                                    onChange={() => handleToggleSelection(c.executable, 'blacklist')}
                                    style={{ display: 'none' }}
                                  />
                                  <FontAwesomeIcon icon={faBan} style={{ width: '12px', opacity: selection === 'blacklist' ? 1 : 0.3 }} />
                                  Blacklist
                                </label>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dialog Footer Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '12px',
                marginTop: 'auto'
              }}>
                <div>
                  {activeTab === 'scanner' && scannedCandidates.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportLog}
                      className="button is-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <FontAwesomeIcon icon={faFileAlt} />
                      Salvar Log
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {activeTab === 'manual' && shouldShowRunExe && (
                    <button
                      type="button"
                      onClick={async () => handleRunExe()}
                      className={`button is-secondary`}
                      disabled={runningSetup || !title.length}
                    >
                      {runningSetup
                        ? t('button.running-setup', 'Running Setup')
                        : t('button.run-exe-first', 'Run Installer First')}
                    </button>
                  )}

                  {activeTab === 'manual' ? (
                    <button
                      type="button"
                      onClick={async () => handleInstall()}
                      className={`button is-success`}
                      disabled={(!selectedExe.length && !gameUrl) || addingApp || searching}
                    >
                      {addingApp && <FontAwesomeIcon icon={faSpinner} spin />}
                      {!addingApp && t('button.finish', 'Finish')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleImportSelectedGames}
                      className={`button is-success`}
                      disabled={scannedCandidates.length === 0 || addingApp}
                    >
                      {addingApp && <FontAwesomeIcon icon={faSpinner} spin />}
                      {!addingApp && t('button.finish', 'Terminar')}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DialogContent>
  )
}
