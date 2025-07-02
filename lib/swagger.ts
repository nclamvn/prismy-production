import swaggerJSDoc from 'swagger-jsdoc'

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Prismy Translation API',
      version: '1.0.0',
      description: `
        **Prismy Translation Platform API**
        
        Enterprise-grade translation service with advanced caching, Vietnamese payment integration, and AI-powered features.
        
        ## Features
        - 🌍 Multi-language translation with Google Translate API
        - ⚡ Advanced caching infrastructure for performance
        - 💳 Multiple payment providers (Stripe, VNPay, MoMo)
        - 🔒 Enterprise security and rate limiting
        - 📊 Real-time analytics and monitoring
        - 🇻🇳 Vietnamese market optimization
        
        ## Authentication
        All API endpoints require authentication via Bearer token in the Authorization header.
        
        ## Rate Limits
        - **Free Tier**: 10 requests/hour
        - **Standard Tier**: 50 requests/hour  
        - **Premium Tier**: 200 requests/hour
        - **Enterprise Tier**: 1000 requests/hour
        
        ## Response Format
        All API responses follow a consistent format with appropriate HTTP status codes.
      `,
      contact: {
        name: 'Prismy Support',
        email: 'support@prismy.ai',
        url: 'https://prismy.ai/support',
      },
      license: {
        name: 'Proprietary',
        url: 'https://prismy.ai/license',
      },
    },
    servers: [
      {
        url: 'https://prismy-production.vercel.app',
        description: 'Production Server',
      },
      {
        url: 'https://prismy-staging.vercel.app',
        description: 'Staging Server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from Supabase authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            code: {
              type: 'string',
              description: 'Error code for programmatic handling',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
            requestId: {
              type: 'string',
              description: 'Unique request identifier for debugging',
            },
          },
        },
        TranslationRequest: {
          type: 'object',
          required: ['text', 'targetLang'],
          properties: {
            text: {
              type: 'string',
              description: 'Text to translate',
              minLength: 1,
              maxLength: 10000,
              example: 'Hello world',
            },
            sourceLang: {
              type: 'string',
              description: 'Source language code (ISO 639-1)',
              default: 'auto',
              example: 'en',
            },
            targetLang: {
              type: 'string',
              description: 'Target language code (ISO 639-1)',
              example: 'vi',
            },
            qualityTier: {
              type: 'string',
              enum: ['basic', 'standard', 'premium'],
              description: 'Translation quality tier',
              default: 'standard',
            },
          },
        },
        TranslationResponse: {
          type: 'object',
          properties: {
            translatedText: {
              type: 'string',
              description: 'Translated text',
              example: 'Xin chào thế giới',
            },
            sourceLang: {
              type: 'string',
              description: 'Detected/provided source language',
              example: 'en',
            },
            targetLang: {
              type: 'string',
              description: 'Target language',
              example: 'vi',
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Translation confidence score',
              example: 0.95,
            },
            cached: {
              type: 'boolean',
              description: 'Whether result was served from cache',
              example: false,
            },
            model: {
              type: 'string',
              description: 'Translation model used',
              example: 'google-translate-v3',
            },
            usage: {
              type: 'object',
              properties: {
                charactersTranslated: {
                  type: 'number',
                  description: 'Number of characters translated',
                },
                remainingQuota: {
                  type: 'number',
                  description: 'Remaining quota for current period',
                },
              },
            },
          },
        },
        CheckoutSession: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Stripe checkout session ID',
              example: 'cs_test_123abc',
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'Checkout URL to redirect user to',
              example: 'https://checkout.stripe.com/pay/cs_test_123abc',
            },
          },
        },
        SubscriptionTier: {
          type: 'string',
          enum: ['free', 'standard', 'premium', 'enterprise'],
          description: 'Available subscription tiers',
        },
        CacheHealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'warning', 'critical'],
              description: 'Overall cache health status',
            },
            overall: {
              type: 'object',
              properties: {
                score: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                  description: 'Overall health score',
                },
                isInFailover: {
                  type: 'boolean',
                  description: 'Whether cache is in failover mode',
                },
              },
            },
            checks: {
              type: 'object',
              description: 'Individual health check results',
            },
            timestamp: {
              type: 'number',
              description: 'Timestamp of health check',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Translation',
        description: 'Text translation endpoints',
      },
      {
        name: 'Payments',
        description: 'Payment and subscription management',
      },
      {
        name: 'Cache',
        description: 'Cache management and monitoring',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints (requires admin access)',
      },
      {
        name: 'User',
        description: 'User account and history management',
      },
    ],
  },
  apis: [
    './app/api/**/*.ts', // Path to the API docs
    './lib/**/*.ts', // Include lib files for component schemas
  ],
}

export const swaggerSpec = swaggerJSDoc(options)

// API endpoint documentation
export const apiDocs = {
  '/api/translate': {
    post: {
      tags: ['Translation'],
      summary: 'Translate text',
      description:
        'Translate text from one language to another using advanced AI models',
      operationId: 'translateText',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/TranslationRequest',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Translation successful',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TranslationResponse',
              },
            },
          },
        },
        400: {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        401: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Usage limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        429: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  '/api/stripe/create-checkout': {
    post: {
      tags: ['Payments'],
      summary: 'Create Stripe checkout session',
      description:
        'Create a new Stripe checkout session for subscription upgrade',
      operationId: 'createStripeCheckout',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['priceId', 'tier'],
              properties: {
                priceId: {
                  type: 'string',
                  description: 'Stripe price ID',
                  example: 'price_1234567890',
                },
                tier: {
                  $ref: '#/components/schemas/SubscriptionTier',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Checkout session created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CheckoutSession',
              },
            },
          },
        },
        400: {
          description: 'Invalid subscription tier',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        401: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  '/api/cache/health': {
    get: {
      tags: ['Cache', 'Admin'],
      summary: 'Get cache health status',
      description: 'Retrieve comprehensive cache system health information',
      operationId: 'getCacheHealth',
      parameters: [
        {
          name: 'include',
          in: 'query',
          description: 'Additional data to include',
          schema: {
            type: 'string',
            enum: ['trends', 'detailed'],
          },
        },
      ],
      responses: {
        200: {
          description: 'Cache health status',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CacheHealthStatus',
              },
            },
          },
        },
        503: {
          description: 'Cache system unhealthy',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  {
                    $ref: '#/components/schemas/CacheHealthStatus',
                  },
                  {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        description: 'Health check error message',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
}
