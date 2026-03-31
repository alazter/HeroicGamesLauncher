import { useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ContextProvider from 'frontend/state/ContextProvider'
import { GameInfo, Runner } from 'common/types'
import SearchBar from '../SearchBar'
import { useTranslation } from 'react-i18next'
import LibraryContext from 'frontend/screens/Library/LibraryContext'
import { normalizeTitle } from 'frontend/helpers/library'
import AddGameButton from 'frontend/screens/Library/components/AddGameButton'
import ActionIcons from 'frontend/components/UI/ActionIcons'

function fixFilter(text: string) {
  const regex = new RegExp(/([?\\|*|+|(|)|[|]|])+/, 'g')
  return text.replaceAll(regex, '')
}

const RUNNER_TO_STORE: Partial<Record<Runner, string>> = {
  legendary: 'Epic',
  gog: 'GOG',
  nile: 'Amazon',
  zoom: 'Zoom'
}

// =========================================================================
// CONFIGURAÇÃO DA BARRA DE PLATAFORMAS (PRD 3.1)
// =========================================================================

// 1. MODO DE EXIBIÇÃO: Escolha entre 'icon-text' | 'icon-only' | 'text-only'
const DISPLAY_MODE = 'icon-text'

// 2. LISTA DE LOJAS (Agora preparada para imagens PNG)
// NOTA: Estes caminhos (ex: '/images/epic.png') são exemplos.
// Na Fase 2, eles virão dinamicamente das configurações do usuário.
const PLATFORMS_LIST = [
  { id: 'epic', name: 'Epic Games', iconPath: '/images/epic.png' },
  { id: 'gog', name: 'GOG', iconPath: '/images/gog.png' },
  { id: 'amazon', name: 'Amazon', iconPath: '/images/amazon.png' },
  { id: 'zoom', name: 'Zoom', iconPath: '/images/zoom.png' },
  { id: 'sideloaded', name: 'Sideloaded', iconPath: '/images/sideloaded.png' },
  { id: 'steam', name: 'Steam', iconPath: '/images/steam.png' }
]
// =========================================================================

export default function LibrarySearchBar() {
  const { epic, gog, sideloadedLibrary, amazon, zoom } =
    useContext(ContextProvider)
  const { handleSearch, filterText } = useContext(LibraryContext)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const normalizedFilterText = useMemo(
    () => normalizeTitle(fixFilter(filterText)),
    [filterText]
  )

  const list = useMemo(() => {
    return [
      ...(epic.library ?? []),
      ...(gog.library ?? []),
      ...(sideloadedLibrary ?? []),
      ...(amazon.library ?? []),
      ...(zoom.library ?? [])
    ]
      .filter(Boolean)
      .filter((el) => {
        return (
          !el.install.is_dlc &&
          normalizeTitle(el.title).includes(normalizedFilterText)
        )
      })
      .sort((g1, g2) => (g1.title < g2.title ? -1 : 1))
  }, [
    amazon.library,
    epic.library,
    gog.library,
    sideloadedLibrary,
    zoom.library,
    normalizedFilterText
  ])

  const handleClick = (game: GameInfo) => {
    handleSearch('')
    navigate(`/gamepage/${game.runner}/${game.app_name}`, {
      state: { gameInfo: game }
    })
  }

  const suggestions = list.map((game) => (
    <li onClick={() => handleClick(game)} key={game.app_name}>
      {game.title} <span>({RUNNER_TO_STORE[game.runner] || game.runner})</span>
    </li>
  ))

  const onInputChanged = (text: string) => {
    handleSearch(text)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* INJEÇÃO DIRETA DE CSS */}
      <style>
        {`
          [data-tour="library-search"] {
            width: 450px !important;
            min-width: 450px !important;
            flex-grow: 0 !important;
          }
          [data-tour="library-search"] > div,
          [data-tour="library-search"] form,
          [data-tour="library-search"] input {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 450px !important;
          }
        `}
      </style>

      {/* ==========================================
          LINHA 1: BARRA DE BUSCA E ÍCONES 
          ========================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          width: '100%'
        }}
      >
        <div data-tour="library-search">
          <SearchBar
            suggestionsListItems={suggestions}
            onInputChanged={onInputChanged}
            value={filterText}
            placeholder={t('search', 'Search for Games')}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
            marginLeft: 'auto'
          }}
        >
          <AddGameButton data-tour="library-add-game" />
          <ActionIcons />
        </div>
      </div>

      {/* ==========================================
          LINHA 2: BARRA DE PLATAFORMAS (PRD 3.1)
          ========================================== */}
      <div
        className="platforms-bar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
          gap: '12px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
        {PLATFORMS_LIST.map((platform) => (
          <button
            key={platform.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: DISPLAY_MODE === 'icon-only' ? '8px 12px' : '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.2s ease',
              flexShrink: 0
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor =
                'rgba(255, 255, 255, 0.15)')
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor =
                'rgba(255, 255, 255, 0.05)')
            }
          >
            {/* Lógica de Renderização Baseada na Escolha (AGORA COM IMAGENS) */}
            {(DISPLAY_MODE === 'icon-text' || DISPLAY_MODE === 'icon-only') && (
              <img
                src={platform.iconPath}
                alt={platform.name}
                style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                /* O onError abaixo esconde a imagem temporariamente se o arquivo .png ainda não existir na pasta */
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}

            {(DISPLAY_MODE === 'icon-text' || DISPLAY_MODE === 'text-only') && (
              <span>{platform.name}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
