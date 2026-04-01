import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function PersonalizationScreen() {
  const { t } = useTranslation()

  // Estes 'estados' vão guardar as imagens temporariamente para mostrar o preview na tela
  const [epicIcon, setEpicIcon] = useState<string | null>(null)
  const [gogIcon, setGogIcon] = useState<string | null>(null)
  const [amazonIcon, setAmazonIcon] = useState<string | null>(null)

  // Função que lê o arquivo escolhido e cria uma URL temporária para o preview
  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setIcon: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setIcon(imageUrl)
    }
  }

  return (
    <div
      data-tour="personalization-screen"
      style={{
        padding: '40px',
        color: 'var(--text-default)',
        width: '100%',
        overflowY: 'auto'
      }}
    >
      {/* Cabeçalho da Tela */}
      <h1
        style={{
          borderBottom: '1px solid var(--body-divider)',
          paddingBottom: '10px'
        }}
      >
        Personalização da Biblioteca
      </h1>
      <p style={{ marginBottom: '30px', color: 'var(--text-muted)' }}>
        Aqui você pode alterar os ícones das plataformas. Selecione imagens de
        sua preferência no formato PNG.
      </p>

      {/* Lista de Plataformas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* --- CARTÃO: EPIC GAMES --- */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            background: 'var(--background-darker)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--body-divider)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: epicIcon ? 'transparent' : 'var(--background)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px dashed var(--text-muted)'
            }}
          >
            {epicIcon ? (
              <img
                src={epicIcon}
                alt="Epic Preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span
                style={{
                  fontSize: '12px',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                Sem Ícone
              </span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Epic Games</h3>
            <input
              type="file"
              accept=".png"
              onChange={(e) => handleImageUpload(e, setEpicIcon)}
              style={{ color: 'var(--text-default)' }}
            />
          </div>
        </div>

        {/* --- CARTÃO: GOG --- */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            background: 'var(--background-darker)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--body-divider)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: gogIcon ? 'transparent' : 'var(--background)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px dashed var(--text-muted)'
            }}
          >
            {gogIcon ? (
              <img
                src={gogIcon}
                alt="GOG Preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span
                style={{
                  fontSize: '12px',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                Sem Ícone
              </span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 10px 0' }}>GOG</h3>
            <input
              type="file"
              accept=".png"
              onChange={(e) => handleImageUpload(e, setGogIcon)}
              style={{ color: 'var(--text-default)' }}
            />
          </div>
        </div>

        {/* --- CARTÃO: AMAZON GAMES --- */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            background: 'var(--background-darker)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--body-divider)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: amazonIcon ? 'transparent' : 'var(--background)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px dashed var(--text-muted)'
            }}
          >
            {amazonIcon ? (
              <img
                src={amazonIcon}
                alt="Amazon Preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span
                style={{
                  fontSize: '12px',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                Sem Ícone
              </span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Amazon Games</h3>
            <input
              type="file"
              accept=".png"
              onChange={(e) => handleImageUpload(e, setAmazonIcon)}
              style={{ color: 'var(--text-default)' }}
            />
          </div>
        </div>
      </div>

      {/* Botão de Salvar no final */}
      <div
        style={{
          marginTop: '40px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <button
          style={{
            padding: '12px 24px',
            cursor: 'pointer',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
          onClick={() => alert('Em breve vamos programar essa função!')}
        >
          Salvar Ícones
        </button>
      </div>
    </div>
  )
}
