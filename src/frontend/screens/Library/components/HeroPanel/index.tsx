import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faCog } from '@fortawesome/free-solid-svg-icons'
import { GameInfo } from 'common/types'

interface Props {
  game: GameInfo
  onClose: () => void
  onSettingsClick?: () => void
}

export default function HeroPanel({ game, onClose, onSettingsClick }: Props) {
  const navigate = useNavigate()

  // O mock mostra playtime em horas, vou usar game.playtime ou valor fictício para teste
  const playTimeStr = '125h' 

  const handlePlay = () => {
    console.log('Launch game: ', game.app_name)
  }

  const handleSettings = () => {
    if (onSettingsClick) {
      onSettingsClick()
    } else {
      navigate(`/gamepage/${game.runner}/${game.app_name}`, { state: { gameInfo: game } })
    }
  }

  const handleStore = () => {
    let storeParam = 'epic'
    if (game.runner === 'gog') storeParam = 'gog'
    if (game.runner === 'nile') storeParam = 'amazon'
    if (game.runner === 'zoom') storeParam = 'zoom'
    navigate(`/store/${storeParam}`)
  }

  // Obter o ID da loja correspondente ao runner para carregar o ícone
  let storeId = 'epic'
  if (game.runner === 'gog') storeId = 'gog'
  else if (game.runner === 'nile') storeId = 'amazon'
  else if (game.runner === 'zoom') storeId = 'zoom'
  else if ((game as any).platform === 'steam' || (game as any).runner === 'steam') storeId = 'steam'

  return (
    <div style={{
      width: '380px',
      height: 'fit-content',
      alignSelf: 'flex-start',
      boxSizing: 'border-box',
      flexShrink: 0,
      background: 'rgba(30, 34, 40, 0.4)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '15px 15px 8px 15px',
      marginLeft: '15px',
      marginRight: '15px',
      marginTop: '-9px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Imagem */}
      <img
        src={game.art_cover || ''}
        alt={game.title}
        style={{
          width: 'calc(100% + 30px)',
          height: '460px',
          marginTop: '-15px',
          marginLeft: '-15px',
          marginRight: '-15px',
          objectFit: 'cover',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          borderBottomLeftRadius: '0px',
          borderBottomRightRadius: '0px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          cursor: 'pointer'
        }}
        onClick={onClose}
      />

      {/* Titulo */}
      <h2 style={{
        fontSize: '18px',
        fontWeight: '700',
        color: '#fff',
        margin: '6px 0',
        textAlign: 'center'
      }}>
        {game.title}
      </h2>

      {/* Ações primárias (Botoes Redondos do Mockup) */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '2px 0' }}>
        {/* 1. Botão da Loja */}
        <button
          onClick={handleStore}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            padding: '10px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
          }}
        >
          <img
            src={`/images/${storeId}.png`}
            alt={storeId}
            style={{ width: '22px', height: '22px', objectFit: 'contain', filter: 'brightness(1.5)' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </button>

        {/* 2. Botão de Configurações do Jogo */}
        <button
          onClick={handleSettings}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
          }}
        >
          <FontAwesomeIcon icon={faCog} style={{ fontSize: '18px' }} />
        </button>

        {/* 3. Botão de Play */}
        <button
          onClick={handlePlay}
          style={{
            background: '#00ffff',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.4)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.6)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.4)'
          }}
        >
          <FontAwesomeIcon icon={faPlay} style={{ fontSize: '16px', marginLeft: '2px' }} />
        </button>
      </div>

      {/* Infos de tempo */}
      <div style={{
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '13px',
        textAlign: 'center',
        margin: '6px 0',
        lineHeight: '1.4'
      }}>
        <div>Tempo de jogo: {playTimeStr}</div>
        <div>Última jogada: Ontem</div>
      </div>

      <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2px 0' }} />

      {/* Links de Sistema (Novo Layout de 2 Colunas com Separador) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
          {/* Coluna 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderRight: '1px solid rgba(255, 255, 255, 0.1)', paddingRight: '4px' }}>
            <HeroLink emoji="🛒" label="Loja" onClick={handleStore} />
            <HeroLink emoji="📥" label="Downloads" onClick={() => navigate('/download-manager')} />
            <HeroLink emoji="📰" label="Notícias" onClick={() => {}} />
          </div>
          {/* Coluna 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '4px' }}>
            <HeroLink emoji="👥" label="Comunidade" onClick={() => window.api.openExternalUrl('https://discord.gg/heroicgameslauncher')} />
            <HeroLink emoji="👤" label="Perfil do Usuário" onClick={() => navigate('/login')} />
            <HeroLink emoji="📰" label="Notícias" onClick={() => {}} />
          </div>
        </div>

        {/* Item Centralizado na Base */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '0px' }}>
          <HeroLink emoji="⚙️" label="Configurações do Launcher" onClick={() => navigate('/settings/general')} center />
        </div>
      </div>
    </div>
  )
}

function HeroLink({ emoji, label, onClick, center }: { emoji: string, label: string, onClick: () => void, center?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'rgba(255, 255, 255, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: center ? 'center' : 'flex-start',
        gap: '8px',
        padding: '4px 8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        width: '100%',
        whiteSpace: 'nowrap'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
        e.currentTarget.style.color = '#fff'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
      }}
    >
      <div style={{
        fontSize: '18px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        flexShrink: 0
      }}>
        {emoji}
      </div>
      <span>{label}</span>
    </button>
  )
}

