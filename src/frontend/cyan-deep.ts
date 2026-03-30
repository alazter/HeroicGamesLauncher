import { DefaultTheme } from 'styled-components'

export const cyanDeepTheme: DefaultTheme = {
  name: 'Cyan Deep Custom',
  type: 'dark',
  colors: {
    // Cores Principais (Ciano Neon)
    primary: '#00FFFF',
    accent: '#00FFFF',

    // Fundo (Simulando o gradiente escuro)
    background: '#04090c', // Um azul muito escuro quase preto
    navbar: '#020507', // Um tom mais escuro para a barra lateral
    cardBg: '#08121a', // Fundo dos cartões um pouco mais claro

    // Textos
    text: '#ffffff',
    textMuted: '#8a99a8', // Cinza azulado para textos secundários

    // Bordas e interações
    border: '#112233',
    hover: 'rgba(0, 255, 255, 0.1)',

    // Outros elementos padrão exigidos pelo tema (mantendo escuros)
    gradient: 'linear-gradient(135deg, #011018 0%, #000000 100%)',
    inputBg: '#0a151f',
    danger: '#ff3333',
    success: '#00FFFF', // Mudamos o sucesso para ciano também
    warning: '#ffcc00',
    info: '#00FFFF'
  }
}
