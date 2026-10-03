export type ThemeColors = {
  accent: string
  danger: string
}

export const themeColorsBySkin: Record<string, ThemeColors> = {
  neutral: { accent: '#9FA8B2', danger: '#ff6b6b' },
  island: { accent: '#2EC4B6', danger: '#FF6F59' },
  traitors: { accent: '#A3B86C', danger: '#8B1E3F' },
  f1: { accent: '#E8B339', danger: '#E10600' },
  nascar: { accent: '#D97B29', danger: '#B3261E' },
}