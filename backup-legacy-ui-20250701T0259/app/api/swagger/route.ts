import { NextResponse } from 'next/server'
import { swaggerSpec } from '@/lib/swagger'

/**
 * @swagger
 * /api/swagger:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the complete OpenAPI specification for the Prismy API
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
  try {
    return NextResponse.json(swaggerSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      }
    })
  } catch (error) {
    console.error('Error generating Swagger spec:', error)
    return NextResponse.json(
      { error: 'Failed to generate API specification' },
      { status: 500 }
    )
  }
}