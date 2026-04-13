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

  const [cardZoom, setCardZoom] = useState<number>(() => {
    return parseInt(storage.getItem('heroic_card_zoom') || '180')
  })

  useEffect(() => {
    const timer = setTimeout(
      () => window.dispatchEvent(new Event('resize')),
      300
    )
    return () => clearTimeout(timer)
  }, [cardZoom])

  // ====================================================================
  // NAVEGAÇÃO MATEMÁTICA: ZONAS, GRADE E PONTES
  // ====================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key))
        return

      const active = document.activeElement as HTMLElement
      if (!active) return

      // Classificação estrita do Foco Atual
      const isGameCard =
        active.classList.contains('gameCard') ||
        active.classList.contains('gameListItem')
      const isZoomBtn =
        active.id === 'zoom-minus-btn' || active.id === 'zoom-plus-btn'
      const isBackToTopBtn = active.id === 'backToTopBtn'

      // O Cabeçalho NÃO pode ser uma capa de jogo!
      const isInsideTopSection =
        !isGameCard &&
        !isZoomBtn &&
        !isBackToTopBtn &&
        (!!active.closest('.Header') ||
          !!active.closest('.listing > div:first-child'))

      const isInsideMainArea =
        isInsideTopSection || isGameCard || isZoomBtn || isBackToTopBtn

      // Extrator Inteligente de Andares (Zonas) do Cabeçalho
      const getTopRows = () => {
        const els = Array.from(
          document.querySelectorAll(
            '.Header button, .Header input, .Header [tabindex="0"], .Header [data-sn-focusable="true"], ' +
              '.listing > div:first-child button, .listing > div:first-child input, .listing > div:first-child [tabindex="0"], .listing > div:first-child [data-sn-focusable="true"]'
          )
        ).filter((el) => {
          // FILTRO BLINDADO: Se for capa de jogo ou container alto, ignora!
          if (
            el.classList.contains('gameCard') ||
            el.classList.contains('gameListItem')
          )
            return false
          const rect = el.getBoundingClientRect()
          const style = window.getComputedStyle(el)
          return (
            rect.height > 0 &&
            rect.height < 80 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            !(el as HTMLInputElement).disabled
          )
        }) as HTMLElement[]

        const rows: { centerY: number; elements: HTMLElement[] }[] = []
        els.forEach((el) => {
          const centerY =
            el.getBoundingClientRect().top +
            el.getBoundingClientRect().height / 2
          let placed = false
          for (const row of rows) {
            if (Math.abs(centerY - row.centerY) < 25) {
              // 25px de precisão para mesma linha
              row.elements.push(el)
              placed = true
              break
            }
          }
          if (!placed) rows.push({ centerY, elements: [el] })
        })

        // Ordena de cima pra baixo, esquerda pra direita
        rows.sort((a, b) => a.centerY - b.centerY)
        rows.forEach((row) =>
          row.elements.sort(
            (a, b) =>
              a.getBoundingClientRect().left - b.getBoundingClientRect().left
          )
        )
        return rows
      }

      // ==================================================================
      // INTERCEPTADOR DA SIDEBAR
      // ==================================================================
      if (!isInsideMainArea && e.key === 'ArrowRight') {
        const rect = active.getBoundingClientRect()
        if (rect.left < 350) {
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()
          const firstCard = Array.from(
            document.querySelectorAll('.gameCard, .gameListItem')
          ).find(
            (el) =>
              window.getComputedStyle(el).display !== 'none' &&
              window.getComputedStyle(el).visibility !== 'hidden'
          ) as HTMLElement
          if (firstCard) {
            firstCard.focus()
            firstCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }
          return
        }
      }

      if (!isInsideMainArea) return

      // ==================================================================
      // 0. LÓGICA DE ZONAS DO CABEÇALHO (VERMELHA, AMARELA, VERDE)
      // ==================================================================
      if (isInsideTopSection) {
        const rows = getTopRows()
        if (rows.length > 0) {
          let currentRowIndex = -1
          let currentElementIndex = -1
          for (let r = 0; r < rows.length; r++) {
            const idx = rows[r].elements.indexOf(active)
            if (idx !== -1) {
              currentRowIndex = r
              currentElementIndex = idx
              break
            }
          }

          if (currentRowIndex !== -1) {
            const currentRow = rows[currentRowIndex]

            if (e.key === 'ArrowRight') {
              e.preventDefault()
              e.stopPropagation()
              e.stopImmediatePropagation()
              if (currentElementIndex < currentRow.elements.length - 1) {
                currentRow.elements[currentElementIndex + 1].focus()
              } else if (currentRowIndex < rows.length - 1) {
                rows[currentRowIndex + 1].elements[0].focus()
              } else {
                const firstCard = Array.from(
                  document.querySelectorAll('.gameCard, .gameListItem')
                ).find(
                  (el) =>
                    window.getComputedStyle(el).display !== 'none' &&
                    window.getComputedStyle(el).visibility !== 'hidden'
                ) as HTMLElement
                if (firstCard) firstCard.focus()
              }
              return
            }

            if (e.key === 'ArrowLeft') {
              if (currentElementIndex > 0) {
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()
                currentRow.elements[currentElementIndex - 1].focus()
              } else {
                return // Vai pra Sidebar
              }
              return
            }

            if (e.key === 'ArrowDown') {
              e.preventDefault()
              e.stopPropagation()
              e.stopImmediatePropagation()
              if (currentRowIndex < rows.length - 1) {
                const nextRow = rows[currentRowIndex + 1].elements
                const activeCenter =
                  active.getBoundingClientRect().left +
                  active.getBoundingClientRect().width / 2
                let closest = nextRow[0]
                let minDistance = Infinity
                nextRow.forEach((el) => {
                  const center =
                    el.getBoundingClientRect().left +
                    el.getBoundingClientRect().width / 2
                  const dist = Math.abs(center - activeCenter)
                  if (dist < minDistance) {
                    minDistance = dist
                    closest = el
                  }
                })
                closest.focus()
              } else {
                const firstCard = Array.from(
                  document.querySelectorAll('.gameCard, .gameListItem')
                ).find(
                  (el) =>
                    window.getComputedStyle(el).display !== 'none' &&
                    window.getComputedStyle(el).visibility !== 'hidden'
                ) as HTMLElement
                if (firstCard) firstCard.focus()
              }
              return
            }

            if (e.key === 'ArrowUp') {
              if (currentRowIndex > 0) {
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()
                const prevRow = rows[currentRowIndex - 1].elements
                const activeCenter =
                  active.getBoundingClientRect().left +
                  active.getBoundingClientRect().width / 2
                let closest = prevRow[0]
                let minDistance = Infinity
                prevRow.forEach((el) => {
                  const center =
                    el.getBoundingClientRect().left +
                    el.getBoundingClientRect().width / 2
                  const dist = Math.abs(center - activeCenter)
                  if (dist < minDistance) {
                    minDistance = dist
                    closest = el
                  }
                })
                closest.focus()
              } else {
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()
              }
              return
            }
          }
        }
      }

      // ==================================================================
      // 1. LÓGICA DE GRADE EXATA PARA AS CAPAS (MATEMÁTICA DE MATRIZ)
      // ==================================================================
      if (isGameCard) {
        const allCards = Array.from(
          document.querySelectorAll('.gameCard, .gameListItem')
        ).filter((el) => {
          const style = window.getComputedStyle(el)
          return style.display !== 'none' && style.visibility !== 'hidden'
        }) as HTMLElement[]

        const currentIndex = allCards.indexOf(active)

        if (currentIndex !== -1) {
          let columns = 1
          if (allCards.length > 1) {
            const firstTop = allCards[0].getBoundingClientRect().top
            for (let i = 1; i < allCards.length; i++) {
              if (allCards[i].getBoundingClientRect().top > firstTop + 20) {
                columns = i
                break
              }
            }
            if (
              columns === 1 &&
              allCards[allCards.length - 1].getBoundingClientRect().top <=
                firstTop + 20
            ) {
              columns = allCards.length
            }
          }

          let nextIndex = -1
          let stayInGrid = true

          if (e.key === 'ArrowRight') {
            if (currentIndex + 1 < allCards.length) {
              nextIndex = currentIndex + 1
            } else {
              e.preventDefault()
              e.stopPropagation()
              e.stopImmediatePropagation()
              return
            }
          } else if (e.key === 'ArrowLeft') {
            if (currentIndex % columns !== 0) {
              nextIndex = currentIndex - 1
            } else {
              return
            }
          } else if (e.key === 'ArrowDown') {
            nextIndex = currentIndex + columns
            if (nextIndex >= allCards.length) {
              const firstItemOfLastRow =
                Math.floor((allCards.length - 1) / columns) * columns
              if (currentIndex < firstItemOfLastRow) {
                nextIndex = allCards.length - 1
              } else {
                stayInGrid = false
              }
            }
          } else if (e.key === 'ArrowUp') {
            nextIndex = currentIndex - columns
            if (nextIndex < 0) {
              stayInGrid = false
            }
          }

          if (stayInGrid && nextIndex !== -1) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            allCards[nextIndex].focus()
            allCards[nextIndex].scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            })
            return
          } else if (!stayInGrid && e.key === 'ArrowDown') {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            const backToTop = document.getElementById('backToTopBtn')
            const zoomBtn = document.getElementById('zoom-minus-btn')
            if (
              backToTop &&
              window.getComputedStyle(backToTop).visibility === 'visible'
            ) {
              backToTop.focus()
            } else if (
              zoomBtn &&
              window.getComputedStyle(zoomBtn).display !== 'none'
            ) {
              zoomBtn.focus()
            }
            return
          } else if (!stayInGrid && e.key === 'ArrowUp') {
            // PONTE DE SUBIDA PERFEITA: Sobe da grade e pega a Sessão Verde!
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            const topRows = getTopRows()
            if (topRows.length > 0) {
              const lastRow = topRows[topRows.length - 1].elements
              const activeCenter =
                active.getBoundingClientRect().left +
                active.getBoundingClientRect().width / 2
              let closest = lastRow[0]
              let minDistance = Infinity
              lastRow.forEach((el) => {
                const center =
                  el.getBoundingClientRect().left +
                  el.getBoundingClientRect().width / 2
                const dist = Math.abs(center - activeCenter)
                if (dist < minDistance) {
                  minDistance = dist
                  closest = el
                }
              })
              closest.focus()
            }
            return
          }
        }
      }

      // ==================================================================
      // 1.5. REGRAS DE OURO DOS BOTÕES FLUTUANTES (ZOOM E VOLTAR AO TOPO)
      // ==================================================================
      if (active.id === 'zoom-minus-btn' && e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        document.getElementById('zoom-plus-btn')?.focus()
        return
      }
      if (active.id === 'zoom-plus-btn' && e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        document.getElementById('zoom-minus-btn')?.focus()
        return
      }
      if (active.id === 'zoom-plus-btn' && e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        return
      }
      if (isZoomBtn && e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        return
      }

      if (isBackToTopBtn && e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        const zoomBtn = document.getElementById('zoom-minus-btn')
        if (zoomBtn && window.getComputedStyle(zoomBtn).display !== 'none')
          zoomBtn.focus()
        return
      }

      if (isZoomBtn && e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        const backToTop = document.getElementById('backToTopBtn')
        if (
          backToTop &&
          window.getComputedStyle(backToTop).visibility === 'visible'
        ) {
          backToTop.focus()
        } else {
          const allCards = Array.from(
            document.querySelectorAll('.gameCard, .gameListItem')
          ).filter(
            (el) =>
              window.getComputedStyle(el).display !== 'none' &&
              window.getComputedStyle(el).visibility !== 'hidden'
          ) as HTMLElement[]
          if (allCards.length > 0) {
            allCards[allCards.length - 1].focus()
            allCards[allCards.length - 1].scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            })
          }
        }
        return
      }

      const isEscapingUpFromBackToTop = isBackToTopBtn && e.key === 'ArrowUp'
      const isEscapingLeftFromZoom =
        active.id === 'zoom-minus-btn' && e.key === 'ArrowLeft'

      if (isEscapingUpFromBackToTop || isEscapingLeftFromZoom) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        const allCards = Array.from(
          document.querySelectorAll('.gameCard, .gameListItem')
        ).filter(
          (el) =>
            window.getComputedStyle(el).display !== 'none' &&
            window.getComputedStyle(el).visibility !== 'hidden'
        ) as HTMLElement[]
        if (allCards.length > 0) {
          const lastCard = allCards[allCards.length - 1]
          lastCard.focus()
          lastCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [])
  // ====================================================================

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
      setTimeout(() => {
        const firstCard = scrollArea.querySelector(
          '[data-sn-focusable="true"], .gameCard'
        ) as HTMLElement
        if (firstCard) {
          firstCard.focus({ preventScroll: true })
        }
      }, 50)
    }
  }

  function handleModal(
    appName: string,
    runner: Runner,
    gameInfo: GameInfo | null
  ) {
    openInstallGameModal({ appName, runner, gameInfo })
  }

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

  const libraryToShow = useMemo(() => {
    let library = [...gamesForAlphabetFilter]

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
    activeStoreFilter,
    assignments
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 45px)'
        }}
      >
        <Header />
        <LibraryTour />

        <div
          className="listing"
          data-sn-section="main-games-grid"
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0
          }}
        >
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

          <div
            id="games-scroll-area"
            data-sn-section="main-games-grid"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              minHeight: 0,
              paddingBottom: '30px',
              paddingRight: '8px'
            }}
          >
            <span id="top" />
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

      <button
        id="backToTopBtn"
        onClick={backToTop}
        ref={backToTopElement}
        tabIndex={0}
        data-sn-focusable="true"
      >
        <ArrowDropUp id="backToTopArrow" className="material-icons" />
      </button>

      {layout === 'grid' && (
        <div
          style={{
            position: 'fixed',
            bottom: '5px',
            right: '50px',
            background: 'rgba(30, 34, 40, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '5px 10px',
            borderRadius: '10px',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '1px solid #4CAF50',
            color: '#fff',
            transition: 'all 0.3s ease'
          }}
        >
          <span style={{ fontSize: '14px' }} title="Tamanho das Capas">
            {' '}
            🔍
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0,0,0,0.3)',
              padding: '3px',
              borderRadius: '6px'
            }}
          >
            <button
              id="zoom-minus-btn"
              onClick={() => {
                const step = 20
                const min = 160
                const newVal = Math.max(min, cardZoom - step)
                setCardZoom(newVal)
                storage.setItem('heroic_card_zoom', newVal.toString())
                setTimeout(
                  () => document.getElementById('zoom-minus-btn')?.focus(),
                  10
                )
              }}
              tabIndex={0}
              data-sn-focusable="true"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              -
            </button>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 'bold',
                minWidth: '40px',
                textAlign: 'center'
              }}
            >
              {cardZoom}px
            </span>
            <button
              id="zoom-plus-btn"
              onClick={() => {
                const step = 20
                const max = 360
                const newVal = Math.min(max, cardZoom + step)
                setCardZoom(newVal)
                storage.setItem('heroic_card_zoom', newVal.toString())
                setTimeout(
                  () => document.getElementById('zoom-plus-btn')?.focus(),
                  10
                )
              }}
              tabIndex={0}
              data-sn-focusable="true"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              +
            </button>
          </div>

          <style>{`
            .gameList {
              grid-template-columns: repeat(auto-fill, minmax(${cardZoom}px, 1fr)) !important;
              gap: 30px !important; 
              padding: 20px !important;
            }
            .gameCard {
              scroll-margin-top: 150px !important;
              scroll-margin-bottom: 50px !important;
            }
            .gameCard:focus-within {
              z-index: 100 !important;
            }
          `}</style>
        </div>
      )}

      {showCategories && <CategoriesManager />}
    </LibraryContext.Provider>
  )
})
