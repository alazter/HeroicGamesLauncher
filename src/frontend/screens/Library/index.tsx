import './index.css'

import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
  memo
} from 'react'

import ArrowDropUp from '@mui/icons-material/ArrowDropUp'
import { Header, UpdateComponent } from 'frontend/components/UI'
import { useTranslation } from 'react-i18next'
import Fuse from 'fuse.js'

import ContextProvider from 'frontend/state/ContextProvider'

import GamesList from './components/GamesList'
import { FavouriteGame, GameInfo, HiddenGame, Runner } from 'common/types'
import ErrorComponent from 'frontend/components/UI/ErrorComponent'
import LibraryHeader from './components/LibraryHeader'
import {
  amazonCategories,
  epicCategories,
  gogCategories,
  sideloadedCategories,
  zoomCategories,
  normalizeTitle
} from 'frontend/helpers/library'
import RecentlyPlayed from './components/RecentlyPlayed'
import LibraryContext from './LibraryContext'
import { Category, PlatformsFilters, StoresFilters } from 'frontend/types'
import { hasHelp } from 'frontend/hooks/hasHelp'
import EmptyLibraryMessage from './components/EmptyLibrary'
import CategoriesManager from './components/CategoriesManager'
import LibraryTour from './components/LibraryTour'
import { openInstallGameModal } from 'frontend/state/InstallGameModal'

const storage = window.localStorage

type SearchableGame = {
  original: GameInfo
  title: string
  normalizedTitle: string
}

export default memo(function Library(): JSX.Element {
  const { t } = useTranslation()

  const {
    libraryStatus,
    refreshing,
    refreshingInTheBackground,
    epic,
    gog,
    amazon,
    zoom,
    sideloadedLibrary,
    favouriteGames,
    libraryTopSection,
    platform,
    currentCustomCategories,
    customCategories,
    hiddenGames,
    gameUpdates
  } = useContext(ContextProvider)

  hasHelp(
    'library',
    t('help.title.library', 'Library'),
    <p>{t('help.content.library', 'Shows all owned games.')}</p>
  )

  const [layout, setLayout] = useState(storage.getItem('layout') || 'grid')
  const handleLayout = (layout: string) => {
    storage.setItem('layout', layout)
    setLayout(layout)
  }

  // ===================================================================
  // NOVO: ESTADO DA BARRA DE ZOOM
  // ===================================================================
  const [cardZoom, setCardZoom] = useState<number>(() => {
    return parseInt(storage.getItem('heroic_card_zoom') || '180')
  })
  // ===================================================================

  let initialStoresfilters: StoresFilters
  const storesFiltersString = storage.getItem('storesFilters')
  if (storesFiltersString) {
    initialStoresfilters = JSON.parse(storesFiltersString) as StoresFilters
  } else {
    const storedCategory = (storage.getItem('category') as Category) || 'all'
    initialStoresfilters = {
      legendary: epicCategories.includes(storedCategory),
      gog: gogCategories.includes(storedCategory),
      nile: amazonCategories.includes(storedCategory),
      sideload: sideloadedCategories.includes(storedCategory),
      zoom: zoom.enabled && zoomCategories.includes(storedCategory)
    }
  }

  const [storesFilters, setStoresFilters_] =
    useState<StoresFilters>(initialStoresfilters)

  const setStoresFilters = (newFilters: StoresFilters) => {
    storage.setItem('storesFilters', JSON.stringify(newFilters))
    setStoresFilters_(newFilters)
  }

  let initialPlatformsfilters: PlatformsFilters
  const plaformsFiltersString = storage.getItem('platformsFilters')
  if (plaformsFiltersString) {
    initialPlatformsfilters = JSON.parse(
      plaformsFiltersString
    ) as PlatformsFilters
  } else {
    const storedCategory = storage.getItem('filterPlatform') || 'all'
    initialPlatformsfilters = {
      win: ['all', 'win'].includes(storedCategory),
      linux: ['all', 'linux'].includes(storedCategory),
      mac: ['all', 'mac'].includes(storedCategory),
      browser: ['all', 'browser'].includes(storedCategory)
    }
  }

  const [platformsFilters, setPlatformsFilters_] = useState<PlatformsFilters>(
    initialPlatformsfilters
  )

  const setPlatformsFilters = (newFilters: PlatformsFilters) => {
    storage.setItem('platformsFilters', JSON.stringify(newFilters))
    setPlatformsFilters_(newFilters)
  }

  const [filterText, setFilterText] = useState('')

  const [showHidden, setShowHidden] = useState<boolean>(
    JSON.parse(storage.getItem('show_hidden') || 'false') as boolean
  )
  const handleShowHidden = (value: boolean) => {
    storage.setItem('show_hidden', JSON.stringify(value))
    setShowHidden(value)
  }

  const [showFavouritesLibrary, setShowFavourites] = useState<boolean>(
    JSON.parse(storage.getItem('show_favorites') || 'false') as boolean
  )
  const handleShowFavourites = (value: boolean) => {
    storage.setItem('show_favorites', JSON.stringify(value))
    setShowFavourites(value)
  }

  const [showInstalledOnly, setShowInstalledOnly] = useState<boolean>(
    JSON.parse(storage.getItem('show_installed_only') || 'false') as boolean
  )
  const handleShowInstalledOnly = (value: boolean) => {
    storage.setItem('show_installed_only', JSON.stringify(value))
    setShowInstalledOnly(value)
  }

  const [showNonAvailable, setShowNonAvailable] = useState<boolean>(
    JSON.parse(storage.getItem('show_non_available') || 'true') as boolean
  )
  const handleShowNonAvailable = (value: boolean) => {
    storage.setItem('show_non_available', JSON.stringify(value))
    setShowNonAvailable(value)
  }

  const [showSupportOfflineOnly, setSupportOfflineOnly] = useState<boolean>(
    JSON.parse(
      storage.getItem('show_support_offline_only') || 'false'
    ) as boolean
  )
  const handleShowSupportOfflineOnly = (value: boolean) => {
    storage.setItem('show_support_offline_only', JSON.stringify(value))
    setSupportOfflineOnly(value)
  }

  const [showThirdPartyManagedOnly, setShowThirdPartyManagedOnly] =
    useState<boolean>(
      JSON.parse(
        storage.getItem('show_third_party_managed_only') || 'false'
      ) as boolean
    )
  const handleShowThirdPartyOnly = (value: boolean) => {
    storage.setItem('show_third_party_managed_only', JSON.stringify(value))
    setShowThirdPartyManagedOnly(value)
  }

  const [showUpdatesOnly, setShowUpdatesOnly] = useState<boolean>(
    JSON.parse(storage.getItem('show_updates_only') || 'false') as boolean
  )
  const handleShowUpdatesOnly = (value: boolean) => {
    storage.setItem('show_updates_only', JSON.stringify(value))
    setShowUpdatesOnly(value)
  }

  const [showCategories, setShowCategories] = useState(false)

  const [showAlphabetFilter, setShowAlphabetFilter] = useState<boolean>(
    JSON.parse(storage.getItem('showAlphabetFilter') || 'true') as boolean
  )
  const handleToggleAlphabetFilter = () => {
    const newValue = !showAlphabetFilter
    storage.setItem('showAlphabetFilter', JSON.stringify(newValue))
    setShowAlphabetFilter(newValue)
  }
  const [alphabetFilterLetter, setAlphabetFilterLetter] = useState<
    string | null
  >(null)

  const [sortDescending, setSortDescending] = useState<boolean>(
    JSON.parse(storage?.getItem('sortDescending') || 'false') as boolean
  )
  function handleSortDescending(value: boolean) {
    storage.setItem('sortDescending', JSON.stringify(value))
    setSortDescending(value)
  }

  const [sortInstalled, setSortInstalled] = useState<boolean>(
    JSON.parse(storage?.getItem('sortInstalled') || 'true') as boolean
  )
  function handleSortInstalled(value: boolean) {
    storage.setItem('sortInstalled', JSON.stringify(value))
    setSortInstalled(value)
  }

  const backToTopElement = useRef<HTMLButtonElement | null>(null)

  // ===================================================================
  // INTELIGÊNCIA DO FILTRO CUSTOMIZADO E EDIÇÃO EM MASSA (LIFT UP)
  // ===================================================================
  const [activeStoreFilter, setActiveStoreFilter] = useState<string | null>(
    () => localStorage.getItem('heroic_active_store_filter')
  )
  const [assignments, setAssignments] = useState<Record<string, string>>(
    () =>
      JSON.parse(
        localStorage.getItem('heroic_game_assignments') || '{}'
      ) as Record<string, string>
  )

  useEffect(() => {
    const handleFilterChange = () =>
      setActiveStoreFilter(localStorage.getItem('heroic_active_store_filter'))
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
  // ===================================================================

  // ===================================================================
  // NOVO: SALVA A POSIÇÃO DA BARRA DE ROLAGEM INTERNA
  // ===================================================================
  useLayoutEffect(() => {
    const scrollPosition = parseInt(storage?.getItem('scrollPosition') || '0')
    const scrollArea = document.getElementById('games-scroll-area')

    const storeScrollPosition = (e: Event) => {
      const target = e.target as HTMLDivElement
      storage?.setItem('scrollPosition', target.scrollTop.toString() || '0')
    }

    if (scrollArea) {
      scrollArea.addEventListener('scroll', storeScrollPosition)
      scrollArea.scrollTo(0, scrollPosition || 0)
    }

    return () => {
      if (scrollArea)
        scrollArea.removeEventListener('scroll', storeScrollPosition)
    }
  }, [])

  // ===================================================================
  // NOVO: MOSTRA O BOTÃO "VOLTAR AO TOPO" BASEADO NO SCROLL INTERNO
  // ===================================================================
  useEffect(() => {
    const btn = document.getElementById('backToTopBtn')
    const scrollArea = document.getElementById('games-scroll-area')

    const scrollCallback = (e: Event) => {
      const target = e.target as HTMLDivElement
      if (btn && target) {
        btn.style.visibility = target.scrollTop > 450 ? 'visible' : 'hidden'
      }
    }

    if (scrollArea) scrollArea.addEventListener('scroll', scrollCallback)
    return () => {
      if (scrollArea) scrollArea.removeEventListener('scroll', scrollCallback)
    }
  }, [])

  const backToTop = () => {
    const scrollArea = document.getElementById('games-scroll-area')
    if (scrollArea) {
      scrollArea.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleModal(
    appName: string,
    runner: Runner,
    gameInfo: GameInfo | null
  ) {
    openInstallGameModal({ appName, runner, gameInfo })
  }

  // cache list of games being installed
  const installing: string[] = useMemo(
    () =>
      (libraryStatus as { status: string; appName: string }[])
        .filter((st) => st.status === 'installing')
        .map((st) => st.appName),
    [libraryStatus]
  )

  const filterByPlatform = useCallback(
    (library: GameInfo[]) => {
      if (!library) {
        return []
      }

      let displayedPlatforms: string[] = []
      if (platformsFilters['win']) displayedPlatforms.push('win')
      if (platformsFilters['mac'] && platform === 'darwin')
        displayedPlatforms.push('mac')
      if (platformsFilters['linux'] && platform === 'linux')
        displayedPlatforms.push('linux')
      if (platformsFilters['browser']) displayedPlatforms.push('browser')

      if (!displayedPlatforms.length) {
        displayedPlatforms = Object.keys(platformsFilters)
      }

      if (displayedPlatforms.includes('win')) displayedPlatforms.push('windows')
      if (displayedPlatforms.includes('mac'))
        displayedPlatforms.push('osx', 'Mac')

      return library.filter((game) => {
        let gamePlatforms: string[] = []

        if (game?.is_installed) {
          gamePlatforms = [game?.install?.platform?.toLowerCase() || 'windows']
        } else {
          if (game.is_linux_native && platform === 'linux') {
            gamePlatforms.push('linux')
          }
          if (game.is_mac_native && platform === 'darwin') {
            gamePlatforms.push('mac')
          }
          gamePlatforms.push('windows')
        }
        return gamePlatforms.some((plat) => displayedPlatforms.includes(plat))
      })
    },
    [platformsFilters, platform]
  )

  const showRecentGames = libraryTopSection.startsWith('recently_played')

  const favouriteGamesList = useMemo(() => {
    if (showHidden) {
      return favouriteGames.list
    }

    const hiddenAppNames = hiddenGames.list.map(
      (hidden: HiddenGame) => hidden.appName
    )

    return favouriteGames.list.filter(
      (game) => !hiddenAppNames.includes(game.appName)
    )
  }, [favouriteGames, showHidden, hiddenGames])

  const showFavourites =
    libraryTopSection === 'favourites' && !!favouriteGamesList.length

  const favourites = useMemo(() => {
    const tempArray: GameInfo[] = []
    if (showFavourites || showFavouritesLibrary) {
      const favouriteAppNames = favouriteGamesList.map(
        (favourite: FavouriteGame) => favourite.appName
      )
      epic.library.forEach((game) => {
        if (favouriteAppNames.includes(game.app_name)) tempArray.push(game)
      })
      gog.library.forEach((game) => {
        if (favouriteAppNames.includes(game.app_name)) tempArray.push(game)
      })
      sideloadedLibrary.forEach((game) => {
        if (favouriteAppNames.includes(game.app_name)) tempArray.push(game)
      })
      amazon.library.forEach((game) => {
        if (favouriteAppNames.includes(game.app_name)) tempArray.push(game)
      })
      zoom.library.forEach((game) => {
        if (favouriteAppNames.includes(game.app_name)) tempArray.push(game)
      })
    }
    return tempArray.sort((a, b) => {
      const gameA = a.title.toUpperCase().replace('THE ', '')
      const gameB = b.title.toUpperCase().replace('THE ', '')
      return gameA.localeCompare(gameB)
    })
  }, [
    showFavourites,
    showFavouritesLibrary,
    favouriteGamesList,
    epic,
    gog,
    amazon,
    sideloadedLibrary,
    zoom
  ])

  const favouritesIds = useMemo(() => {
    return favourites.map((game) => `${game.app_name}_${game.runner}`)
  }, [favourites])

  const makeLibrary = useCallback(() => {
    let displayedStores: string[] = []
    if (storesFilters['gog'] && gog.username) displayedStores.push('gog')
    if (storesFilters['legendary'] && epic.username)
      displayedStores.push('legendary')
    if (storesFilters['nile'] && amazon.username) displayedStores.push('nile')
    if (storesFilters['sideload']) displayedStores.push('sideload')
    if (storesFilters['zoom'] && zoom.username) displayedStores.push('zoom')

    if (!displayedStores.length) {
      displayedStores = Object.keys(storesFilters)
    }

    const showEpic = epic.username && displayedStores.includes('legendary')
    const showGog = gog.username && displayedStores.includes('gog')
    const showAmazon = amazon.user_id && displayedStores.includes('nile')
    const showSideloaded = displayedStores.includes('sideload')
    const showZoom = zoom.username && displayedStores.includes('zoom')

    const epicLibrary = showEpic ? epic.library : []
    const gogLibrary = showGog ? gog.library : []
    const sideloadedApps = showSideloaded ? sideloadedLibrary : []
    const amazonLibrary = showAmazon ? amazon.library : []
    const zoomLibrary = showZoom ? zoom.library : []

    return [
      ...sideloadedApps,
      ...epicLibrary,
      ...gogLibrary,
      ...amazonLibrary,
      ...zoomLibrary
    ]
  }, [storesFilters, epic, gog, amazon, zoom, sideloadedLibrary])

  const gamesForAlphabetFilter = useMemo(() => {
    let library: Array<GameInfo> = makeLibrary()

    if (showFavouritesLibrary) {
      library = library.filter((game) =>
        favouritesIds.includes(`${game.app_name}_${game.runner}`)
      )
    } else {
      library = library.filter((game) => !game.install.is_dlc)

      if (currentCustomCategories && currentCustomCategories.length > 0) {
        const gamesInSelectedCategories = new Set<string>()

        currentCustomCategories.forEach((category) => {
          if (category === 'preset_uncategorized') {
            const categorizedGames = Array.from(
              new Set(Object.values(customCategories.list).flat())
            )

            library.forEach((game) => {
              if (
                !categorizedGames.includes(`${game.app_name}_${game.runner}`)
              ) {
                gamesInSelectedCategories.add(`${game.app_name}_${game.runner}`)
              }
            })
          } else {
            const gamesInCustomCategory = customCategories.list[category]

            if (gamesInCustomCategory) {
              gamesInCustomCategory.forEach((game) => {
                gamesInSelectedCategories.add(game)
              })
            }
          }
        })

        library = library.filter((game) =>
          gamesInSelectedCategories.has(`${game.app_name}_${game.runner}`)
        )
      }

      if (showSupportOfflineOnly) {
        library = library.filter((game) => game.canRunOffline)
      }

      if (showThirdPartyManagedOnly) {
        library = library.filter((game) => !!game.thirdPartyManagedApp)
      }

      if (showUpdatesOnly) {
        library = library.filter((game) => gameUpdates.includes(game.app_name))
      }

      if (!showNonAvailable) {
        const nonAvailbleGames = storage.getItem('nonAvailableGames') || '[]'
        const nonAvailbleGamesArray = JSON.parse(nonAvailbleGames) as string[]
        library = library.filter(
          (game) => !nonAvailbleGamesArray.includes(game.app_name)
        )
      }

      if (showInstalledOnly) {
        library = library.filter((game) => game.is_installed)
      }
    }

    try {
      const filteredLibrary = filterByPlatform(library)
      const searchableLibrary: SearchableGame[] = filteredLibrary.map(
        (game) => ({
          original: game,
          title: game.title,
          normalizedTitle: normalizeTitle(game.title)
        })
      )

      const options = {
        minMatchCharLength: 1,
        threshold: 0.4,
        useExtendedSearch: true,
        keys: ['title', 'normalizedTitle']
      }
      const fuse = new Fuse(searchableLibrary, options)

      if (filterText) {
        const fuzzySearch: GameInfo[] = fuse
          .search(filterText)
          .map(
            (result: { item: { original: GameInfo } }) => result.item.original
          )
        library = fuzzySearch
      } else {
        library = filteredLibrary
      }
    } catch (error) {
      console.log(error)
    }

    const hiddenGamesAppNames = hiddenGames.list.map(
      (hidden: HiddenGame) => hidden?.appName
    )

    if (!showHidden) {
      library = library.filter(
        (game) => !hiddenGamesAppNames.includes(game?.app_name)
      )
    }

    return library
  }, [
    filterText,
    showHidden,
    hiddenGames,
    showFavouritesLibrary,
    favouritesIds,
    currentCustomCategories,
    customCategories,
    showInstalledOnly,
    showNonAvailable,
    showSupportOfflineOnly,
    showThirdPartyManagedOnly,
    showUpdatesOnly,
    gameUpdates,
    filterByPlatform,
    makeLibrary
  ])

  // select library
  const libraryToShow = useMemo(() => {
    let library = [...gamesForAlphabetFilter]

    // Alphabetical filter
    if (alphabetFilterLetter) {
      library = library.filter((game) => {
        if (!game.title) return false

        const processedTitle = game.title.replace(/^the\s/i, '')
        const firstCharMatch = processedTitle.match(/[a-zA-Z0-9]/)
        if (!firstCharMatch) return false
        const firstChar = firstCharMatch[0].toUpperCase()

        if (alphabetFilterLetter === '#') {
          return /[0-9]/.test(firstChar)
        } else {
          return firstChar === alphabetFilterLetter
        }
      })
    }

    // =========================================================
    // O FILTRO DA LOJA ATUANDO AQUI ANTES DO CONTADOR!
    // =========================================================
    if (activeStoreFilter) {
      library = library.filter((game) => {
        const explicitlyAssignedStore = assignments[game.app_name]

        if (explicitlyAssignedStore) {
          return explicitlyAssignedStore === activeStoreFilter
        }

        if (activeStoreFilter === 'epic' && game.runner === 'legendary')
          return true
        if (activeStoreFilter === 'gog' && game.runner === 'gog') return true
        if (activeStoreFilter === 'amazon' && game.runner === 'nile')
          return true
        if (activeStoreFilter === 'zoom' && game.runner === 'zoom') return true
        if (activeStoreFilter === 'sideloaded' && game.runner === 'sideload')
          return true

        return false
      })
    }
    // =========================================================

    // sort
    library = library.sort((a, b) => {
      const gameA = a.title.toUpperCase().replace('THE ', '')
      const gameB = b.title.toUpperCase().replace('THE ', '')
      return sortDescending
        ? -gameA.localeCompare(gameB)
        : gameA.localeCompare(gameB)
    })
    const installed = library.filter((game) => game?.is_installed)
    const notInstalled = library.filter(
      (game) => !game?.is_installed && !installing.includes(game?.app_name)
    )
    const installingGames = library.filter(
      (g) => !g.is_installed && installing.includes(g.app_name)
    )

    library = sortInstalled
      ? [...installed, ...installingGames, ...notInstalled]
      : library

    return [...library]
  }, [
    gamesForAlphabetFilter,
    alphabetFilterLetter,
    sortDescending,
    sortInstalled,
    installing,
    activeStoreFilter, // A biblioteca refaz a conta quando isso muda
    assignments // A biblioteca refaz a conta se um jogo mudar de loja
  ])

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    const setHeaderHightCSS = () => {
      if (timer) clearTimeout(timer)

      timer = setTimeout(() => {
        const header = document.querySelector('.Header')
        if (header) {
          const headerHeight = header.getBoundingClientRect().height
          const libraryHeader =
            document.querySelector<HTMLDivElement>('.libraryHeader')
          if (libraryHeader)
            libraryHeader.style.setProperty(
              '--header-height',
              `${headerHeight}px`
            )
        }
      }, 50)
    }
    setHeaderHightCSS()
    window.addEventListener('resize', setHeaderHightCSS)

    return () => {
      window.removeEventListener('resize', setHeaderHightCSS)
    }
  }, [])

  if (!epic && !gog && !amazon && !zoom) {
    return (
      <ErrorComponent
        message={t(
          'generic.error.component',
          'No Games found - Try to logout and login again or one of the options bellow'
        )}
      />
    )
  }

  return (
    <LibraryContext.Provider
      value={{
        storesFilters,
        platformsFilters,
        layout,
        showHidden,
        showFavourites: showFavouritesLibrary,
        showInstalledOnly,
        showNonAvailable,
        filterText,
        setStoresFilters,
        handleLayout: handleLayout,
        setPlatformsFilters,
        handleSearch: setFilterText,
        setShowHidden: handleShowHidden,
        setShowFavourites: handleShowFavourites,
        setShowInstalledOnly: handleShowInstalledOnly,
        setShowNonAvailable: handleShowNonAvailable,
        setSortDescending: handleSortDescending,
        setSortInstalled: handleSortInstalled,
        showSupportOfflineOnly,
        setShowSupportOfflineOnly: handleShowSupportOfflineOnly,
        showThirdPartyManagedOnly,
        setShowThirdPartyManagedOnly: handleShowThirdPartyOnly,
        showUpdatesOnly,
        setShowUpdatesOnly: handleShowUpdatesOnly,
        sortDescending,
        sortInstalled,
        handleAddGameButtonClick: () => handleModal('', 'sideload', null),
        setShowCategories,
        showAlphabetFilter: showAlphabetFilter,
        onToggleAlphabetFilter: handleToggleAlphabetFilter,
        gamesForAlphabetFilter,
        alphabetFilterLetter,
        setAlphabetFilterLetter
      }}
    >
      {/* ============================================================== */}
      {/* NOVO: WRAPPER PARA TRAVAR A TELA E DIVIDIR CABEÇALHO DO SCROLL */}
      {/* ============================================================== */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <Header />
        <LibraryTour />

        <div
          className="listing"
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden'
          }}
        >
          {/* CABEÇALHO FIXO: Esse bloco nunca mais vai rolar para cima! */}
          <div style={{ flexShrink: 0 }}>
            {showRecentGames && (
              <RecentlyPlayed
                handleModal={handleModal}
                onlyInstalled={libraryTopSection.endsWith('installed')}
                showHidden={showHidden}
              />
            )}

            {showFavourites && !showFavouritesLibrary && (
              <>
                <div
                  className="library-section-header"
                  data-tour="library-header"
                >
                  <h3 className="libraryHeader">
                    {t('favourites', 'Favourites')}
                  </h3>
                </div>
                <GamesList
                  library={favourites}
                  handleGameCardClick={handleModal}
                  isFavourite
                  isFirstLane
                />
              </>
            )}

            <LibraryHeader list={libraryToShow} />
          </div>

          {/* ÁREA DE SCROLL: O Quadrado Amarelo! */}
          <div
            id="games-scroll-area"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingBottom: '100px'
            }}
          >
            <span id="top" /> {/* Movido para dentro do scroll */}
            {refreshing && !refreshingInTheBackground && <UpdateComponent />}
            {libraryToShow.length === 0 && <EmptyLibraryMessage />}
            {libraryToShow.length > 0 &&
              (!refreshing || refreshingInTheBackground) && (
                <GamesList
                  library={libraryToShow}
                  layout={layout}
                  handleGameCardClick={handleModal}
                />
              )}
          </div>
        </div>
      </div>
      {/* ============================================================== */}

      <button id="backToTopBtn" onClick={backToTop} ref={backToTopElement}>
        <ArrowDropUp id="backToTopArrow" className="material-icons" />
      </button>

      {/* ============================================================== */}
      {/* BARRA DE ZOOM FLUTUANTE INJETANDO CSS NO GRID                  */}
      {/* ============================================================== */}
      {layout === 'grid' && (
        <div
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: 'rgba(30, 34, 40, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '10px 20px',
            borderRadius: '12px',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '1px solid #4CAF50',
            color: '#fff',
            transition: 'all 0.3s ease'
          }}
        >
          <span style={{ fontSize: '18px' }} title="Tamanho das Capas">
            🔍
          </span>
          <input
            type="range"
            min="100"
            max="400"
            value={cardZoom}
            onChange={(e) => {
              const val = Number(e.target.value)
              setCardZoom(val)
              storage.setItem('heroic_card_zoom', val.toString())
            }}
            style={{
              cursor: 'pointer',
              width: '120px',
              accentColor: '#4CAF50'
            }}
          />
          <style>{`
            .gameList {
              grid-template-columns: repeat(auto-fill, minmax(${cardZoom}px, 1fr)) !important;
            }
          `}</style>
        </div>
      )}
      {/* ============================================================== */}

      {showCategories && <CategoriesManager />}
    </LibraryContext.Provider>
  )
})
