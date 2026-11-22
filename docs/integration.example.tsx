/* eslint-disable react/only-export-components */
import React from 'react'
import {
  FinSyncStatement,
  type Statement,
  type FinSyncPresentationConfig,
  exportPdf,
  exportPng,
} from '../src'
import { statement } from '../src/data/statement'

/**
 * Developer Integration Example
 *
 * Demonstrates how an external application can import FinSync,
 * pass its own typed financial statement data, customize branding,
 * and render or export statements across multiple formats.
 *
 * FinSync is structured as a source-level developer template; external
 * applications import directly from './src' or their monorepo alias.
 */

// 1. Established synthetic statement (Maksud Rahman, •••• 4821, Savings Account, INR)
const customerStatement: Statement = statement

// 2. Define custom brand & theme configuration (Acme Finance branding)
const customConfig: FinSyncPresentationConfig = {
  brandName: 'Acme Finance',
  logoUrl: '/acme-logo.svg',
  logoAlt: 'Acme Finance Logo',
  locale: 'en-IN',
  theme: {
    primaryColor: '#0F52BA', // Sapphire Blue brand identity
    textColor: '#0B1A2C', // Deep navy ink
    mutedColor: '#5A6E85', // Slate secondary
    surfaceColor: '#FFFFFF', // Crisp white surface
    subtleSurfaceColor: '#F0F5FA', // Pale corporate tint
    borderColor: '#D4E2EE', // Crisp border line
    borderRadius: 10,
    spacingScale: 1.05,
  },
  optionalSections: {
    accountDetails: true,
    financialSummary: true,
    transactions: true,
  },
}

// 3. Render the interactive statement component
export function ExternalApplicationStatement() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF9' }}>
      <FinSyncStatement
        statement={customerStatement}
        config={customConfig}
        initialView="web"
      />
    </div>
  )
}

// 4. Standalone export triggers
export async function triggerCustomerPdfExport() {
  await exportPdf(null, customerStatement, customConfig)
}

export async function triggerCustomerPngExport() {
  await exportPng(null, customerStatement, customConfig)
}
