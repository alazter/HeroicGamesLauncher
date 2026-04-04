import React, { useState, useEffect } from 'react'

interface CustomStore {
  id: string
  name: string
  icon: string | null
}

export default function PersonalizationScreen() {
  const [bgImage, setBgImage] = useState<string | null>(() => {
    return localStorage.getItem('heroic_custom_bg')
  })

  const [stores, setStores] = useState<CustomStore[]>(() => {
    const saved = localStorage.getItem('heroic_custom_stores')
    if (saved) {
      try {
        return JSON.parse(saved) as CustomStore[]
      } catch (err) {
        console.error('Erro ao ler stores:', err)
      }
    }
    return [
      { id: 'epic', name: 'Epic Games', icon: null },
      { id: 'gog', name: 'GOG', icon: null }
    ]
  })

  useEffect(() => {
    localStorage.setItem('heroic_custom_stores', JSON.stringify(stores))
    window.dispatchEvent(new Event('customStoresChanged'))
  }, [stores])

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setBgImage(base64)
      localStorage.setItem('heroic_custom_bg', base64)
      window.dispatchEvent(new Event('customBgChanged'))
    }
    reader.readAsDataURL(file)
  }

  const handleIconUpload = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setStores((prev) =>
        prev.map((s) => (s.id === id ? { ...s, icon: base64 } : s))
      )
    }
    reader.readAsDataURL(file)
  }

  const handleNameChange = (id: string, newName: string) => {
    setStores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    )
  }

  const handleAddStore = () => {
    const newStore: CustomStore = {
      id: 'store-' + Date.now(),
      name: 'Nova Loja',
      icon: null
    }
    setStores((prev) => [...prev, newStore])
  }

  const handleRemoveStore = (id: string) => {
    setStores((prev) => prev.filter((s) => s.id !== id))
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newStores = [...stores]
    const temp = newStores[index]
    newStores[index] = newStores[index - 1]
    newStores[index - 1] = temp
    setStores(newStores)
  }

  const moveDown = (index: number) => {
    if (index === stores.length - 1) return
    const newStores = [...stores]
    const temp = newStores[index]
    newStores[index] = newStores[index + 1]
    newStores[index + 1] = temp
    setStores(newStores)
  }

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        color: '#fff',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: bgImage ? `url(${bgImage})` : 'none',
          backgroundColor: bgImage ? 'transparent' : '#121212',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(5px) brightness(0.7)',
          zIndex: 0
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: '450px',
          bottom: '20px',
          background:
            '#131a20' /* A SUA COR HEX AQUI: Fundo sólido para leitura */,
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflowY: 'auto'
        }}
      >
        <h2>Personalização</h2>
        <div>
          <span
            style={{
              fontSize: '12px',
              color: '#aaa',
              textTransform: 'uppercase'
            }}
          >
            Background 1860x950
          </span>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.05)',
              padding: '15px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '10px',
              border: '1px dashed rgba(255,255,255,0.2)'
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleBgUpload}
              style={{ display: 'none' }}
            />
            <span style={{ fontWeight: 'bold' }}>Trocar Imagem de Fundo</span>
          </label>
        </div>
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '20px'
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: '#aaa',
              textTransform: 'uppercase'
            }}
          >
            Gerenciar Lojas
          </span>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginTop: '10px'
            }}
          >
            {stores.map((store, index) => (
              <div
                key={store.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(0,0,0,0.4)',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <button
                    onClick={() => moveUp(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    ▼
                  </button>
                </div>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  {store.icon && (
                    <img
                      src={store.icon}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  )}
                </div>
                <input
                  type="text"
                  value={store.name}
                  onChange={(e) => handleNameChange(store.id, e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none',
                    padding: '6px',
                    borderRadius: '4px'
                  }}
                />
                <label
                  style={{
                    cursor: 'pointer',
                    padding: '6px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px'
                  }}
                >
                  <input
                    type="file"
                    accept=".png"
                    onChange={(e) => handleIconUpload(store.id, e)}
                    style={{ display: 'none' }}
                  />
                  <span>📷</span>
                </label>
                <button
                  onClick={() => handleRemoveStore(store.id)}
                  style={{
                    background: '#ff4444',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  Deletar
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddStore}
            style={{
              background: '#4CAF50',
              border: 'none',
              color: '#fff',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              width: '100%',
              marginTop: '20px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            + Adicionar Loja
          </button>
        </div>
      </div>
    </div>
  )
}
