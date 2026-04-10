import { useState, useEffect } from 'react'
import LibrarySearchBar from '../LibrarySearchBar'
import CategoryFilter from '../CategoryFilter'
import LibraryFilters from '../LibraryFilters'
import './index.css'

export default function Header() {
  const [isMassEditMode, setIsMassEditMode] = useState(false)

  const toggleMassEdit = () => {
    const newState = !isMassEditMode
    setIsMassEditMode(newState)
    window.dispatchEvent(
      new CustomEvent('heroicToggleMassEdit', { detail: { active: newState } })
    )
  }

  useEffect(() => {
    // Tipando o evento como CustomEvent para o TS parar de reclamar
    const handleExternalCancel = (e: Event) => {
      const customEvent = e as CustomEvent<{ active: boolean }>
      if (customEvent.detail?.active === false) setIsMassEditMode(false)
    }
    window.addEventListener('heroicToggleMassEdit', handleExternalCancel)
    return () =>
      window.removeEventListener('heroicToggleMassEdit', handleExternalCancel)
  }, [])

  return (
    <>
      <div className="Header">
        <div className="Header__search">
          <LibrarySearchBar />
        </div>
        <span className="Header__filters">
          <button
            onClick={toggleMassEdit}
            style={{
              background: isMassEditMode
                ? 'rgba(198, 40, 40, 0.8)'
                : 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '0 18px',
              height: '42px',
              borderRadius: '20px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(5px)',
              transition: 'all 0.2s'
            }}
          >
            {isMassEditMode ? 'Cancelar Edição' : 'Edição em Massa'}
          </button>

          <CategoryFilter />
          <LibraryFilters />
        </span>
      </div>
    </>
  )
}
