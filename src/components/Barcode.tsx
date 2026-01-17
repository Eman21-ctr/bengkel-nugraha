'use client'

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

interface BarcodeProps {
    value: string
    format?: 'CODE128' | 'CODE39' | 'EAN13' | 'ITF'
    width?: number
    height?: number
    displayValue?: boolean
    fontSize?: number
    margin?: number
    className?: string
}

export default function Barcode({
    value,
    format = 'CODE128',
    width = 2,
    height = 100,
    displayValue = true,
    fontSize = 20,
    margin = 10,
    className
}: BarcodeProps) {
    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        if (svgRef.current && value) {
            JsBarcode(svgRef.current, value, {
                format,
                width,
                height,
                displayValue,
                fontSize,
                margin,
                background: '#ffffff',
                lineColor: '#000000'
            })
        }
    }, [value, format, width, height, displayValue, fontSize, margin])

    return <svg ref={svgRef} className={className}></svg>
}
