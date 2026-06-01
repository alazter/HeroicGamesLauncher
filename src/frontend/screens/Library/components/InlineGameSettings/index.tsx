import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { GameInfo } from 'common/types'
import { UpdateComponent } from 'frontend/components/UI'
import useSettingsContext from 'frontend/hooks/useSettingsContext'
import SettingsContext from 'frontend/screens/Settings/SettingsContext'
import VerboseLogs from 'frontend/screens/Settings/components/VerboseLogs'
import LauncherArgs from 'frontend/screens/Settings/components/LauncherArgs'
import BeforeLaunchScriptPath from 'frontend/screens/Settings/components/BeforeLaunchScriptPath'
import AfterLaunchScriptPath from 'frontend/screens/Settings/components/AfterLaunchScriptPath'
import EnvVariablesTable from 'frontend/screens/Settings/components/EnvVariablesTable'

interface Props {
  game: GameInfo
  onClose: () => void
}

export default function InlineGameSettings({ game, onClose }: Props) {
  const settingsContextValues = useSettingsContext({
    appName: game.app_name,
    gameInfo: game,
    runner: game.runner
  })

  if (!settingsContextValues) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(30, 34, 40, 0.4)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px',
        marginTop: '-9px',
        marginRight: '15px',
        height: '100%',
        minHeight: 0
      }}>
        <UpdateComponent />
      </div>
    )
  }

  return (
    <SettingsContext.Provider value={settingsContextValues}>
      <div 
        className="inline-game-settings-container"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(20, 24, 30, 0.45)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          padding: '24px',
          marginTop: '-9px',
          marginRight: '15px',
          marginBottom: '20px',
          height: 'calc(100% - 11px)',
          minHeight: 0,
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}
      >
        {/* Cabeçalho */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          width: '100%'
        }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: '700',
            color: '#fff',
            margin: 0
          }}>
            {game.title} (Configurações)
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
            }}
          >
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: '14px' }} />
          </button>
        </div>

        {/* Abas */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '24px',
          width: '100%'
        }}>
          <div style={{
            color: '#00ffff',
            fontWeight: '700',
            fontSize: '13px',
            letterSpacing: '1px',
            paddingBottom: '12px',
            borderBottom: '2px solid #00ffff',
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}>
            Avançado
          </div>
        </div>

        {/* Área de rolagem para os inputs */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Logs */}
          <div>
            <VerboseLogs />
          </div>

          {/* Argumentos */}
          <div>
            <LauncherArgs />
          </div>

          {/* Scripts */}
          <div>
            <h3 style={{
              fontSize: '15px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              paddingBottom: '6px'
            }}>
              Scripts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <BeforeLaunchScriptPath />
              <AfterLaunchScriptPath />
            </div>
          </div>

          {/* Variáveis de Ambiente */}
          <div style={{ paddingBottom: '10px' }}>
            <EnvVariablesTable />
          </div>
        </div>
      </div>
    </SettingsContext.Provider>
  )
}
