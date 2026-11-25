import * as React from 'react'
void React
import { Column, Image, Row, Text } from '@hyper-elements/react'
import { token } from '../theme'

export interface BrandHeaderProps {
  brandName: string
  logoUrl?: string
  logoAlt?: string
  eyebrow?: string
  title?: string
  period?: string
  variant?: 'standard' | 'compact' | 'email' | 'canvas'
}

export function BrandHeader({
  brandName,
  logoUrl,
  logoAlt,
  eyebrow,
  title,
  period,
  variant = 'standard',
}: BrandHeaderProps) {
  if (variant === 'compact') {
    return (
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row style={{ gap: 8, alignItems: 'center' }}>
          {logoUrl && (
            <Image
              src={logoUrl}
              alt={logoAlt || `${brandName} logo`}
              style={{ width: 24, height: 24 }}
            />
          )}
          <Text style={{ fontSize: 16, fontWeight: 700, color: token('colors.primary') }}>
            {brandName}
          </Text>
        </Row>
        {period && (
          <Text style={{ fontSize: 10, color: token('colors.muted') }}>
            {period}
          </Text>
        )}
      </Row>
    )
  }

  if (variant === 'canvas') {
    return (
      <Row style={{ gap: 10, alignItems: 'center' }}>
        {logoUrl && (
          <Image
            src={logoUrl}
            alt={logoAlt || `${brandName} logo`}
            style={{ width: 32, height: 32 }}
          />
        )}
        <Text style={{ fontSize: 22, fontWeight: 700, color: token('colors.primary') }}>
          {brandName}
        </Text>
        <Text
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: token('colors.primary'),
            padding: [4, 8],
            backgroundColor: token('colors.primarySoft'),
            borderRadius: token('radii.sm'),
            letterSpacing: 0.5,
          }}
        >
          {eyebrow || 'FINANCIAL SNAPSHOT'}
        </Text>
        {period && (
          <Text style={{ fontSize: 11, color: token('colors.muted') }}>
            {period}
          </Text>
        )}
      </Row>
    )
  }

  if (variant === 'email') {
    return (
      <Column style={{ gap: 12 }}>
        <Row style={{ gap: 8, alignItems: 'center' }}>
          {logoUrl && (
            <Image
              src={logoUrl}
              alt={logoAlt || `${brandName} logo`}
              style={{ width: 28, height: 28 }}
            />
          )}
          <Text style={{ fontSize: 18, fontWeight: 700, color: token('colors.primary') }}>
            {brandName}
          </Text>
        </Row>
        {eyebrow && (
          <Text
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: token('colors.primary'),
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {eyebrow}
          </Text>
        )}
      </Column>
    )
  }

  return (
    <Column style={{ gap: 8 }}>
      <Column style={{ gap: 4 }}>
        {eyebrow && (
          <Text
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: token('colors.primary'),
              textTransform: 'uppercase',
              letterSpacing: 1.2,
            }}
          >
            {eyebrow}
          </Text>
        )}
        {title && (
          <Text style={{ fontSize: 30, fontWeight: 700, color: token('colors.ink') }}>
            {title}
          </Text>
        )}
        {period && (
          <Text style={{ color: token('colors.muted'), fontSize: 13 }}>
            {period}
          </Text>
        )}
      </Column>
      <Row style={{ gap: 8, alignItems: 'center' }}>
        {logoUrl && (
          <Image
            src={logoUrl}
            alt={logoAlt || `${brandName} logo`}
            style={{ width: 30, height: 30 }}
          />
        )}
        <Text style={{ fontSize: 18, fontWeight: 700, color: token('colors.primary') }}>
          {brandName}
        </Text>
      </Row>
    </Column>
  )
}
