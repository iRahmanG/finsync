import { FinSyncStatement } from './FinSyncStatement'
import { statement } from './data/statement'
import { useState } from 'react'

function App() {
  const [themeName, setThemeName] = useState<'fintech' | 'violet'>('fintech')
  const violetTheme = themeName === 'violet'

  return (
    <div>
      <label className="theme-preset no-print">
        Theme
        <select value={themeName} onChange={(event) => setThemeName(event.target.value as 'fintech' | 'violet')}>
          <option value="fintech">Fintech default</option>
          <option value="violet">Violet custom</option>
        </select>
      </label>
      <FinSyncStatement
        statement={statement}
        config={violetTheme ? {
          brandName: 'Northstar',
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
        } : { locale: 'en-IN' }}
      />
    </div>
  )
}

export default App
