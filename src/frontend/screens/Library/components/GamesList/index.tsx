import { useContext, useEffect, useRef, useState, useMemo, memo } from 'react'
import { GameInfo, Runner } from 'common/types'
import cx from 'classnames'
import GameCard from '../GameCard'
import ContextProvider from 'frontend/state/ContextProvider'
import { useTranslation } from 'react-i18next'

interface CustomStore {
  id: string
  name: string
  icon: string | null
  isVisible?: boolean
}

interface Props {
  library: GameInfo[]
  layout?: string
  isFirstLane?: boolean
  handleGameCardClick: (
    app_name: string,
    runner: Runner,
    gameInfo: GameInfo
  ) => void
  onlyInstalled?: boolean
  isRecent?: boolean
  isFavourite?: boolean
}

// ===================================================================
// NOVO: ATUALIZAÇÃO DO SCROLL DO CONTROLE/TECLADO
// ===================================================================
const scrollCardIntoView = (ev: FocusEvent) => {
  const windowHeight = window.innerHeight
  const trgt = ev.target as HTMLElement
  const rect = trgt.getBoundingClientRect()

  // Busca a nossa nova caixa de rolagem (ou cai no fallback antigo)
  const scrollArea =
    document.getElementById('games-scroll-area') || document.body

  if (rect.top < 100) {
    scrollArea.scrollTo({
      top: trgt.parentElement!.offsetTop - 200,
      behavior: 'smooth'
    })
  } else if (rect.bottom > windowHeight - 100) {
    scrollArea.scrollTo({
      top: trgt.parentElement!.offsetTop - windowHeight + rect.height + 150,
      behavior: 'smooth'
    })
  }
}
// ===================================================================

const GamesList = ({
  library = [],
  layout = 'grid',
  handleGameCardClick,
  isFirstLane = false,
  onlyInstalled = false,
  isRecent = false,
  isFavourite = false
}: Props): JSX.Element => {
  const { gameUpdates, allTilesInColor, titlesAlwaysVisible } =
    useContext(ContextProvider)
  const { t } = useTranslation()
  const listRef = useRef<HTMLDivElement | null>(null)
  const { activeController } = useContext(ContextProvider)

  // ===================================================================
  // SISTEMA DE FILTRO E EDIÇÃO EM MASSA
  // ===================================================================
  const [isMassEditMode, setIsMassEditMode] = useState(false)
  const [selectedGames, setSelectedGames] = useState<GameInfo[]>([])
  const [selectedStore, setSelectedStore] = useState<string>('')

  const [activeStoreFilter, setActiveStoreFilter] = useState<string | null>(
    () => localStorage.getItem('heroic_active_store_filter')
  )

  // ERRO 1 RESOLVIDO: Casting seguro do retorno do JSON.parse
  const [customStores] = useState<CustomStore[]>(() => {
    const saved = localStorage.getItem('heroic_custom_stores')
    return saved ? (JSON.parse(saved) as CustomStore[]) : []
  })

  // ERRO 2 RESOLVIDO: Casting seguro do retorno do JSON.parse
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    return JSON.parse(
      localStorage.getItem('heroic_game_assignments') || '{}'
    ) as Record<string, string>
  })

  useEffect(() => {
    const handleFilterChange = () =>
      setActiveStoreFilter(localStorage.getItem('heroic_active_store_filter'))

    // ERRO 3 RESOLVIDO: Casting seguro do argumento do setAssignments
    const handleAssignmentsChange = () =>
      setAssignments(
        JSON.parse(
          localStorage.getItem('heroic_game_assignments') || '{}'
        ) as Record<string, string>
      )

    window.addEventListener('heroicFilterChanged', handleFilterChange)
    window.addEventListener('gameAssignmentsChanged', handleAssignmentsChange)

    return () => {
      window.removeEventListener('heroicFilterChanged', handleFilterChange)
      window.removeEventListener(
        'gameAssignmentsChanged',
        handleAssignmentsChange
      )
    }
  }, [])

  const handleAssign = () => {
    if (!selectedStore) {
      alert('Por favor, selecione uma loja primeiro!')
      return
    }

    const newAssignments = { ...assignments }
    selectedGames.forEach((game) => {
      newAssignments[game.app_name] = selectedStore
    })

    localStorage.setItem(
      'heroic_game_assignments',
      JSON.stringify(newAssignments)
    )
    setAssignments(newAssignments)
    window.dispatchEvent(new Event('gameAssignmentsChanged'))

    setSelectedGames([])
    setIsMassEditMode(false)
    setSelectedStore('')
  }

  // A MÁGICA DO FILTRO
  const filteredLibrary = useMemo(() => {
    if (!activeStoreFilter) return library

    return library.filter((game) => {
      const explicitlyAssignedStore = assignments[game.app_name]

      if (explicitlyAssignedStore) {
        return explicitlyAssignedStore === activeStoreFilter
      }

      if (activeStoreFilter === 'epic' && game.runner === 'legendary')
        return true
      if (activeStoreFilter === 'gog' && game.runner === 'gog') return true
      if (activeStoreFilter === 'amazon' && game.runner === 'nile') return true
      if (activeStoreFilter === 'zoom' && game.runner === 'zoom') return true
      if (activeStoreFilter === 'sideloaded' && game.runner === 'sideload')
        return true

      return false
    })
  }, [library, activeStoreFilter, assignments])
  // ===================================================================

  // ===================================================================
  // O "OLHEIRO" DEVOLVIDO E CORRIGIDO (Carrega as capas e os cliques)
  // ===================================================================
  useEffect(() => {
    if (filteredLibrary.length) {
      const options = {
        rootMargin: '500px',
        threshold: 0
      }

      const callback: IntersectionObserverCallback = (entries, observer) => {
        const entered: string[] = []
        entries.forEach((entry) => {
          if (entry.intersectionRatio > 0) {
            const appName = (entry.target as HTMLDivElement).dataset
              .appName as string
            if (appName) entered.push(appName)
            observer.unobserve(entry.target)
          }
        })
        if (entered.length > 0) {
          window.dispatchEvent(
            new CustomEvent('visible-cards', { detail: { appNames: entered } })
          )
        }
      }

      const observer = new IntersectionObserver(callback, options)

      document.querySelectorAll('[data-invisible]').forEach((card) => {
        observer.observe(card)
      })

      return () => {
        observer.disconnect()
      }
    }
    return () => ({})
  }, [filteredLibrary])

  // ERROS 4 E 5 RESOLVIDOS: Capturando listRef.current em uma variável local segura e limpando os arrays de dependência
  useEffect(() => {
    const listNode = listRef.current
    if (listNode && activeController) {
      listNode.addEventListener('focus', scrollCardIntoView, {
        capture: true
      })
      return () => {
        listNode.removeEventListener('focus', scrollCardIntoView, {
          capture: true
        })
      }
    }
    return () => ({})
  }, [activeController])

  return (
    <>
      {library.length > 0 && !isFirstLane && (
        <button
          onClick={() => {
            setIsMassEditMode(!isMassEditMode)
            setSelectedGames([])
          }}
          style={{
            position: 'fixed',
            top: '15px' /* Altura perfeita para a barra de ferramentas nativa */,
            right:
              '335px' /* Espaçamento ajustado para ficar colado com Categorias */,
            background: isMassEditMode
              ? 'rgba(198, 40, 40, 0.8)'
              : 'transparent',
            color: '#fff',
            border:
              '1px solid rgba(255, 255, 255, 0.25)' /* Borda igual aos botões nativos */,
            padding: '0 18px',
            height: '42px' /* Altura idêntica aos botões nativos */,
            borderRadius: '20px' /* Deixa o botão redondo estilo pílula */,
            fontWeight: '500',
            cursor: 'pointer',
            zIndex: 9998,
            boxShadow: isMassEditMode ? '0 5px 15px rgba(0,0,0,0.3)' : 'none',
            transition: 'all 0.2s',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter:
              'blur(5px)' /* Leve desfoque no fundo para premium feel */
          }}
        >
          {isMassEditMode ? 'Cancelar Edição' : 'Edição em Massa'}
        </button>
      )}

      {isMassEditMode && selectedGames.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30, 34, 40, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '15px 30px',
            borderRadius: '12px',
            zIndex: 9999,
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '1px solid #4CAF50',
            color: '#fff'
          }}
        >
          <span style={{ fontWeight: 'bold' }}>
            {selectedGames.length} jogo(s) selecionado(s)
          </span>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            style={{
              background: '#13171c',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '8px 12px',
              borderRadius: '6px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">Atribuir à Loja...</option>
            {customStores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            style={{
              background: '#4CAF50',
              color: '#fff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Aplicar
          </button>
        </div>
      )}

      <div
        style={
          !filteredLibrary.length ? { backgroundColor: 'transparent' } : {}
        }
        className={cx({
          gameList: layout === 'grid',
          gameListLayout: layout === 'list',
          firstLane: isFirstLane,
          allTilesInColor,
          titlesAlwaysVisible
        })}
        ref={listRef}
      >
        {layout === 'list' && (
          <div className="gameListHeader">
            <span>{t('game.title', 'Game Title')}</span>
            <span>{t('game.status', 'Status')}</span>
            <span>{t('game.store', 'Store')}</span>
            <span>{t('wine.actions', 'Action')}</span>
          </div>
        )}
        {!!filteredLibrary.length &&
          filteredLibrary.map((gameInfo, index) => {
            const { app_name, is_installed, runner } = gameInfo
            const isJustPlayed = (isFavourite || isRecent) && index === 0
            let is_dlc = false
            if (gameInfo.runner !== 'sideload') {
              is_dlc = gameInfo.install.is_dlc ?? false
            }

            if (is_dlc) return null
            if (!is_installed && onlyInstalled) return null

            const hasUpdate = is_installed && gameUpdates?.includes(app_name)
            const isSelected = selectedGames.some(
              (g) => g.app_name === app_name
            )

            return (
              <div
                key={`${runner}_${app_name}${isFirstLane ? '_firstlane' : ''}`}
                style={{
                  position: 'relative',
                  cursor: isMassEditMode ? 'pointer' : 'default',
                  display: 'flex',
                  width: '100%',
                  height: '100%'
                }}
                onClickCapture={(e) => {
                  if (isMassEditMode) {
                    e.stopPropagation()
                    e.preventDefault()
                    if (isSelected) {
                      setSelectedGames(
                        selectedGames.filter((g) => g.app_name !== app_name)
                      )
                    } else {
                      setSelectedGames([...selectedGames, gameInfo])
                    }
                  }
                }}
              >
                {isMassEditMode && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      zIndex: 10,
                      background: isSelected ? '#4CAF50' : 'rgba(0,0,0,0.6)',
                      border: '2px solid #fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 'bold',
                      pointerEvents: 'none',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                    }}
                  >
                    {isSelected && '✓'}
                  </div>
                )}
                <div
                  style={{
                    pointerEvents: isMassEditMode ? 'none' : 'auto',
                    opacity: isMassEditMode && !isSelected ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <GameCard
                    hasUpdate={hasUpdate}
                    buttonClick={() => {
                      if (gameInfo.runner !== 'sideload')
                        handleGameCardClick(app_name, runner, gameInfo)
                    }}
                    forceCard={layout === 'grid'}
                    isRecent={isRecent}
                    gameInfo={gameInfo}
                    justPlayed={isJustPlayed}
                    dataTour={index === 0 ? 'library-game-card' : undefined}
                  />
                </div>
              </div>
            )
          })}
      </div>
    </>
  )
}

// ERRO 6 RESOLVIDO: Usando o memo importado diretamente do 'react' ao invés de React.memo
export default memo(GamesList)
