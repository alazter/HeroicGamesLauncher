import {
  faBorderAll,
  faList,
  faSyncAlt,
  faArrowDownAZ,
  faArrowDownZA,
  faHardDrive as hardDriveSolid,
  faFilter,
  faFilterCircleXmark
} from '@fortawesome/free-solid-svg-icons'
import { faHardDrive as hardDriveLight } from '@fortawesome/free-regular-svg-icons'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import ContextProvider from 'frontend/state/ContextProvider'
import FormControl from '../FormControl'
import './index.css'
import classNames from 'classnames'
import LibraryContext from 'frontend/screens/Library/LibraryContext'


interface ActionIconsProps {
  'data-tour'?: string
}

export default React.memo(function ActionIcons({
  'data-tour': dataTour
}: ActionIconsProps = {}) {
  const { t } = useTranslation()
  const { refreshLibrary, refreshing } = useContext(ContextProvider)

  const {
    handleLayout,
    layout,
    sortDescending,
    setSortDescending,
    sortInstalled,
    setSortInstalled,
    showAlphabetFilter,
    onToggleAlphabetFilter
  } = useContext(LibraryContext)

  const [useInlinePanel, setUseInlinePanel] = React.useState<boolean>(() => {
    return localStorage.getItem('heroic_use_inline_panel') !== 'false'
  })

  const handleToggle = () => {
    const newVal = !useInlinePanel
    setUseInlinePanel(newVal)
    localStorage.setItem('heroic_use_inline_panel', newVal ? 'true' : 'false')
    window.dispatchEvent(new Event('heroicUseInlinePanelChanged'))
  }

  React.useEffect(() => {
    const handleModeChange = () => {
      const active = localStorage.getItem('heroic_use_inline_panel') !== 'false'
      setUseInlinePanel(active)
    }
    window.addEventListener('heroicUseInlinePanelChanged', handleModeChange)
    return () => window.removeEventListener('heroicUseInlinePanelChanged', handleModeChange)
  }, [])

  return (
    <div className="ActionIcons" data-tour={dataTour}>
      <FormControl segmented small>
        {layout === 'grid' ? (
          <button
            className="FormControl__button"
            title={t('library.toggleLayout.list', 'Toggle to a list layout')}
            onClick={() => handleLayout('list')}
          >
            <FontAwesomeIcon
              className="FormControl__segmentedFaIcon"
              icon={faList}
              data-tour="library-view-toggle"
            />
          </button>
        ) : (
          <button
            className="FormControl__button"
            title={t('library.toggleLayout.grid', 'Toggle to a grid layout')}
            onClick={() => handleLayout('grid')}
          >
            <FontAwesomeIcon
              className="FormControl__segmentedFaIcon"
              icon={faBorderAll}
              data-tour="library-view-toggle"
            />
          </button>
        )}
        <button
          className="FormControl__button"
          title={
            sortDescending
              ? t('library.sortDescending', 'Sort Descending')
              : t('library.sortAscending', 'Sort Ascending')
          }
          onClick={() => setSortDescending(!sortDescending)}
        >
          <FontAwesomeIcon
            className="FormControl__segmentedFaIcon"
            icon={sortDescending ? faArrowDownZA : faArrowDownAZ}
            data-tour="library-sort-az"
          />
        </button>
        <button
          className="FormControl__button"
          title={t('library.sortByStatus', 'Sort by Status')}
          onClick={() => setSortInstalled(!sortInstalled)}
        >
          <FontAwesomeIcon
            className="FormControl__segmentedFaIcon"
            icon={sortInstalled ? hardDriveSolid : hardDriveLight}
            data-tour="library-sort-installed"
          />
        </button>
        <button
          className="FormControl__button"
          title={
            showAlphabetFilter
              ? t('library.hideAlphabetFilter', 'Hide Alphabet Filter')
              : t('library.showAlphabetFilter', 'Show Alphabet Filter')
          }
          onClick={onToggleAlphabetFilter}
        >
          <FontAwesomeIcon
            className="FormControl__segmentedFaIcon"
            icon={showAlphabetFilter ? faFilterCircleXmark : faFilter}
          />
        </button>
        <button
          className={classNames('FormControl__button', {
            active: refreshing
          })}
          title={t('generic.library.refresh', 'Refresh Library')}
          onClick={async () =>
            refreshLibrary({
              checkForUpdates: true
            })
          }
        >
          <FontAwesomeIcon
            className={classNames('FormControl__segmentedFaIcon', {
              ['fa-spin']: refreshing
            })}
            data-tour="library-refresh"
            icon={faSyncAlt}
          />
        </button>
      </FormControl>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', minWidth: '70px', textAlign: 'right', whiteSpace: 'nowrap' }}>
          {useInlinePanel ? 'Novo Modo' : 'Modo Antigo'}
        </span>
        <label className="premium-switch">
          <input
            type="checkbox"
            checked={useInlinePanel}
            onChange={handleToggle}
          />
          <span className="premium-slider"></span>
        </label>
      </div>
    </div>
  )
})
