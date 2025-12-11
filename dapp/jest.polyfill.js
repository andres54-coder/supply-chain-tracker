// Polyfill para React.act en React 19
// Este archivo debe ejecutarse ANTES de setupFilesAfterEnv
// para que React.act esté disponible cuando react-dom/test-utils lo necesite

import * as React from 'react'
import { act } from 'react'

// Asegurar que React esté disponible globalmente con act
// Esto debe hacerse ANTES de que se importe cualquier módulo que use react-dom/test-utils
global.React = React
global.React.act = act

// También asegurar que act esté disponible directamente en React
if (!React.act) {
  Object.defineProperty(React, 'act', {
    value: act,
    writable: true,
    configurable: true,
  })
}

