/* eslint-disable react/only-export-components */
import React from 'react'
import {
  FinSyncStatement,
  StatementPageDocument,
  StatementEmailDocument,
  PdfDocument,
  CanvasDocument,
  type Statement,
  type FinSyncPresentationConfig,
  type FinSyncRendererConfig,
} from '../src'
import { statement } from '../src/data/statement'

/**
 * Acme Finance Customization Example
 *
 * Demonstrates that FinSync is fully decoupled from its default branding
 * and can be themed for an external organization ("Acme Finance") with custom
 * colors, brand assets, and styling applied consistently across all four outputs:
 * Web, Email, PDF, and Canvas.
 */

export const acmeConfig: FinSyncPresentationConfig = {
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

export const acmeRendererConfig: FinSyncRendererConfig = {
  brandName: acmeConfig.brandName!,
  locale: acmeConfig.locale!,
  logoUrl: acmeConfig.logoUrl,
  logoAlt: acmeConfig.logoAlt,
  theme: acmeConfig.theme,
  optionalSections: acmeConfig.optionalSections,
}

// 1. Interactive UI Shell (React DOM + Hyper Elements Web Statement)
export function AcmeInteractiveStatement({ statementData = statement }: { statementData?: Statement }) {
  return (
    <FinSyncStatement
      statement={statementData}
      config={acmeConfig}
      initialView="web"
    />
  )
}

// 2. Direct Hyper Elements Document Builders for External Integrations
export function createAcmeWebDocument(statementData: Statement = statement) {
  return StatementPageDocument({
    statement: statementData,
    transactions: statementData.transactions,
    rendererConfig: acmeRendererConfig,
  })
}

export function createAcmeEmailDocument(statementData: Statement = statement) {
  return StatementEmailDocument({
    statement: statementData,
    statementUrl: 'https://acmefinance.example.com/statements/current',
    rendererConfig: acmeRendererConfig,
  })
}

export function createAcmePdfDocument(statementData: Statement = statement) {
  return React.createElement(PdfDocument, {
    statement: statementData,
    rendererConfig: acmeRendererConfig,
  })
}

export function createAcmeCanvasDocument(statementData: Statement = statement) {
  return React.createElement(CanvasDocument, {
    statement: statementData,
    rendererConfig: acmeRendererConfig,
  })
}
