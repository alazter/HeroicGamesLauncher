import { useState } from 'react'
import './index.css'
import { HelpItem } from 'frontend/types'
import { useTranslation } from 'react-i18next'

interface Props {
  items: Record<string, HelpItem>
}

export default function Help({ items }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const toggleOpen = () => {
    setOpen((prev) => !prev)
  }

  return (
    <>
      <button
        className={`HelpButton ${open ? 'open' : ''}`}
        onClick={toggleOpen}
        title={
          open
            ? t('help.button.close', 'Close Help')
            : t('help.button.open', 'Open Help')
        }
      >
        ?
      </button>

      <div
        className={`HelpContent ${open ? 'open' : ''}`}
        id="help_content"
      >
        {Object.entries(items).map(([key, item]) => (
          <details key={key}>
            <summary>{item.title}</summary>
            {item.content}
          </details>
        ))}
      </div>
    </>
  )
}