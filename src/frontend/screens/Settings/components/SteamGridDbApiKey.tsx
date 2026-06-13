import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InfoBox, TextInputField } from 'frontend/components/UI'

export default function SteamGridDbApiKey() {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const url = 'www.steamgriddb.com/profile/preferences/api'
  const DUMMY_MASK = '••••••••••••••••'

  useEffect(() => {
    void window.api.steamgriddb.hasApiKey().then((exists) => {
      setHasKey(exists)
      if (exists) {
        setValue(DUMMY_MASK)
      }
    })
  }, [])

  const onChange = (newValue: string) => {
    setValue(newValue)
    if (newValue === '') {
      void window.api.steamgriddb.setApiKey('').then(() => {
        setHasKey(false)
      })
    } else if (newValue !== DUMMY_MASK) {
      void window.api.steamgriddb.setApiKey(newValue).then(() => {
        setHasKey(true)
      })
    }
  }

  const onFocus = () => {
    if (value === DUMMY_MASK) {
      setValue('')
    }
  }

  const onBlur = () => {
    if (value === '' && hasKey) {
      setValue(DUMMY_MASK)
    }
  }

  const placeholder = hasKey
    ? t(
        'settings.steamgriddb.apikey.placeholder_saved',
        'Key saved — type to replace, clear to remove'
      )
    : t(
        'settings.steamgriddb.apikey.placeholder',
        'Enter your SteamGridDB API Key here'
      )

  return (
    <TextInputField
      label={t('settings.steamgriddb.apikey.title', 'SteamGridDB API Key')}
      placeholder={placeholder}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      value={value}
      htmlId="steamgriddb-api-key"
      type="password"
      afterInput={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          {hasKey && (
            <button
              type="button"
              className="button outline"
              style={{
                alignSelf: 'flex-start',
                borderColor: '#ff4444',
                color: '#ff4444',
                padding: '4px 12px',
                fontSize: '13px',
                borderRadius: '8px',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
              onClick={() => {
                setValue('')
                void window.api.steamgriddb.setApiKey('').then(() => {
                  setHasKey(false)
                })
              }}
            >
              {t('settings.steamgriddb.apikey.remove', 'Remover Chave')}
            </button>
          )}

          <InfoBox text={t('settings.advanced.details', 'Details')}>
            <span style={{ userSelect: 'text' }}>
              {t(
                'settings.steamgriddb.help.description',
                'Provide your own SteamGridDB API key to enable game cover search. The key is stored encrypted when your system supports it. You can get one at {{url}}',
                { url }
              )}
            </span>
          </InfoBox>
        </div>
      }
    />
  )
}
