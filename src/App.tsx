import { FinSyncStatement } from './FinSyncStatement'
import { statement } from './data/statement'
import { useState } from 'react'

function App() {
  const [themeName, setThemeName] = useState<'fintech' | 'violet'>('fintech')
  const violetTheme = themeName === 'violet'

  return (
    <div>
      <FinSyncStatement
        statement={statement}
        themePreset={{
          value: themeName,
          options: [
            { value: 'fintech', label: 'Fintech default' },
            { value: 'violet', label: 'Violet custom' },
          ],
          onChange: (value) => setThemeName(value as 'fintech' | 'violet'),
        }}
        config={violetTheme ? {
          brandName: 'FinSync',
          locale: 'en-US',
          theme: {
            primaryColor: '#7C3AED',
            textColor: '#201B2D',
            mutedColor: '#756F7D',
            surfaceColor: '#FFFFFF',
            subtleSurfaceColor: '#FBF8FF',
            borderColor: '#E8E0F3',
            borderRadius: 14,
            spacingScale: 1.05,
          },
        } : { brandName: 'FinSync', locale: 'en-IN' }}
      />
    </div>
  )
}

export default App
