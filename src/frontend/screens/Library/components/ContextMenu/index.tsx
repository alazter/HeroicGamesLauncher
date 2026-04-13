import React, { type ReactElement, useState, memo } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import './index.css'
import { ListItemIcon } from '@mui/material'

export interface Item {
  icon: ReactElement
  label: string
  onclick: () => void
  show: boolean
}

interface Props {
  children: React.ReactNode
  items: Item[]
}

function ContextMenu({ children, items }: Props) {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
  } | null>(null)

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX,
            mouseY: event.clientY - 2
          }
        : null
    )
  }

  const handleClose = () => {
    setContextMenu(null)
  }

  const handleClick = (callback: { (): void }) => {
    handleClose()
    callback()
  }

  // Descobre qual é a primeira opção visível para puxar o foco do Gamepad pra ela
  const firstVisibleIndex = items.findIndex((item) => item.show)

  return (
    <div onContextMenu={handleContextMenu} style={{ cursor: 'context-menu' }}>
      {children}
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        className="contextMenu"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : { top: 0, left: 0 }
        }
        onKeyDown={(e) => {
          // ESCUDO: Impede que o nosso interceptador global do Library.tsx
          // roube o foco se você apertar esquerda/direita aqui dentro!
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.stopPropagation()
          }
        }}
      >
        {items.map(
          ({ label, onclick, show, icon }, i) =>
            show && (
              <MenuItem
                key={i}
                onClick={() => handleClick(onclick)}
                data-sn-focusable="true" // Torna o item visível para o D-Pad
                tabIndex={0}
                autoFocus={i === firstVisibleIndex} // Imã de foco ao abrir o menu
                onKeyDown={(e) => {
                  // Garante que o botão 'A' do controle execute o clique
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClick(onclick)
                  }
                }}
              >
                <ListItemIcon>{icon}</ListItemIcon>
                {label}
              </MenuItem>
            )
        )}
      </Menu>
    </div>
  )
}

export default memo(ContextMenu)
