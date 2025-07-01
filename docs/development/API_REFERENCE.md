# Prismy API Reference

## Overview

This document provides comprehensive API reference for the Prismy translation platform, including all endpoints, data structures, and usage examples.

## Table of Contents

1. [Authentication](#authentication)
2. [Workspace Intelligence API](#workspace-intelligence-api)
3. [AI Agent API](#ai-agent-api)
4. [Translation API](#translation-api)
5. [Document Processing API](#document-processing-api)
6. [Performance Monitoring API](#performance-monitoring-api)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

## Authentication

### Overview

Prismy uses Supabase Auth for authentication with JWT tokens. All API endpoints require authentication unless otherwise noted.

### Authentication Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Endpoints

#### POST /api/auth/login

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://example.com/avatar.jpg",
      "language": "en",
      "emailVerified": true,
      "preferences": {
        "language": "en",
        "theme": "system",
        "notifications": {
          "email": true,
          "push": true
        }
      }
    },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "expiresIn": 3600,
      "expiresAt": "2024-01-01T01:00:00Z"
    },
    "session": {
      "id": "session-123",
      "userId": "user-123",
      "deviceId": "device-123",
      "expiresAt": "2024-01-01T01:00:00Z"
    }
  }
}
```

#### POST /api/auth/register

Register new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* User object */ },
    "tokens": { /* Token object */ },
    "session": { /* Session object */ },
    "requiresVerification": true,
    "verificationMethod": "email"
  }
}
```

#### POST /api/auth/logout

Logout current user session.

**Request Body:**
```json
{
  "sessionId": "session-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

#### GET /api/auth/me

Get current user information.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* User object */ },
    "permissions": ["read", "write", "admin"],
    "subscription": {
      "plan": "premium",
      "expiresAt": "2024-12-31T23:59:59Z",
      "features": ["unlimited_translations", "ai_collaboration"]
    }
  }
}
```

## Workspace Intelligence API

### Overview

The Workspace Intelligence API provides access to the AI-powered workspace system that tracks user activities, learns patterns, and provides intelligent suggestions.

### Endpoints

#### GET /api/workspace/state

Get current workspace state.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentMode": "translation",
    "context": {
      "activeDocuments": ["doc-123"],
      "cursor": { "line": 10, "column": 5 },
      "viewport": { "scroll": 100, "zoom": 1.2 }
    },
    "activities": [
      {
        "id": "activity-123",
        "type": "translation",
        "status": "completed",
        "input": "Hello world",
        "output": "Xin chào thế giới",
        "duration": 2500,
        "timestamp": "2024-01-01T12:00:00Z"
      }
    ],
    "patterns": {
      "preferredLanguages": {
        "source": ["en"],
        "target": ["vi", "es"]
      },
      "workingHours": {
        "start": "09:00",
        "end": "17:00",
        "timezone": "UTC"
      },
      "efficiency": {
        "averageTranslationTime": 2500,
        "errorRate": 0.05
      }
    },
    "activeOperations": [
      {
        "id": "op-123",
        "type": "document_translation",
        "status": "in_progress",
        "progress": 45,
        "estimatedCompletion": "2024-01-01T12:30:00Z"
      }
    ],
    "suggestions": [
      {
        "id": "sug-123",
        "type": "workflow_optimization",
        "title": "Use keyboard shortcuts",
        "description": "Speed up your workflow with Ctrl+Enter",
        "confidence": 0.85,
        "action": {
          "type": "show_shortcut_hint",
          "shortcut": "Ctrl+Enter"
        }
      }
    ],
    "insights": [
      {
        "id": "insight-123",
        "type": "performance",
        "title": "Translation speed improved",
        "description": "Your translation speed increased by 20% this week",
        "confidence": 0.92
      }
    ]
  }
}
```

#### POST /api/workspace/activities

Record new workspace activity.

**Request Body:**
```json
{
  "type": "translation",
  "status": "completed",
  "input": "Hello world",
  "output": "Xin chào thế giới",
  "languages": {
    "source": "en",
    "target": "vi"
  },
  "metadata": {
    "provider": "openai",
    "model": "gpt-4",
    "confidence": 0.95
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activity": {
      "id": "activity-456",
      "type": "translation",
      "status": "completed",
      "timestamp": "2024-01-01T12:00:00Z",
      "duration": 2500
    }
  }
}
```

#### POST /api/workspace/operations

Start new workspace operation.

**Request Body:**
```json
{
  "type": "document_translation",
  "input": {
    "documentId": "doc-123",
    "targetLanguages": ["vi", "es"],
    "options": {
      "preserveFormatting": true,
      "useCollaboration": true
    }
  },
  "priority": "high",
  "estimatedDuration": 1800000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "operation": {
      "id": "op-456",
      "type": "document_translation",
      "status": "pending",
      "progress": 0,
      "estimatedCompletion": "2024-01-01T12:30:00Z",
      "assignedAgents": ["translator-alpha", "reviewer-beta"]
    }
  }
}
```

#### PUT /api/workspace/operations/:id

Update operation status.

**Request Body:**
```json
{
  "status": "in_progress",
  "progress": 50,
  "notes": "Translation phase completed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "operation": {
      "id": "op-456",
      "status": "in_progress",
      "progress": 50,
      "updatedAt": "2024-01-01T12:15:00Z"
    }
  }
}
```

#### GET /api/workspace/suggestions

Get workspace suggestions.

**Query Parameters:**
- `category` (optional): Filter by suggestion category
- `limit` (optional): Maximum number of suggestions (default: 10)
- `minConfidence` (optional): Minimum confidence threshold (default: 0.7)

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "sug-456",
        "type": "language_pair",
        "category": "efficiency",
        "title": "Switch to preferred languages",
        "description": "Use English → Vietnamese based on your history",
        "confidence": 0.88,
        "action": {
          "type": "set_languages",
          "source": "en",
          "target": "vi"
        },
        "estimatedTimesSaved": 30,
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "hasNext": true
    }
  }
}
```

#### POST /api/workspace/suggestions/:id/apply

Apply a workspace suggestion.

**Response:**
```json
{
  "success": true,
  "data": {
    "result": {
      "applied": true,
      "changes": {
        "sourceLanguage": "en",
        "targetLanguage": "vi"
      },
      "message": "Languages updated successfully"
    }
  }
}
```

#### DELETE /api/workspace/suggestions/:id

Dismiss a workspace suggestion.

**Response:**
```json
{
  "success": true,
  "message": "Suggestion dismissed"
}
```

## AI Agent API

### Overview

The AI Agent API manages the collaborative AI agent system for enhanced translation and analysis capabilities.

### Endpoints

#### GET /api/agents

Get available AI agents.

**Query Parameters:**
- `type` (optional): Filter by agent type (translator, reviewer, analyzer)
- `status` (optional): Filter by status (idle, active, busy)
- `specialization` (optional): Filter by specialization
- `limit` (optional): Maximum number of agents (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "agent-translator-1",
        "name": "Translation Specialist Alpha",
        "description": "Expert in English-Vietnamese translation",
        "type": "translator",
        "specialization": ["en-vi", "technical_translation"],
        "status": "idle",
        "capabilities": ["translate", "quality_check", "context_analysis"],
        "performance": {
          "overall": {
            "score": 0.93,
            "reliability": 0.96,
            "efficiency": 0.89,
            "accuracy": 0.94
          },
          "metrics": {
            "tasksCompleted": 1250,
            "averageCompletionTime": 2200,
            "successRate": 0.96,
            "collaborationScore": 0.91
          }
        },
        "availability": {
          "currentLoad": 0,
          "maxConcurrentTasks": 5,
          "estimatedWaitTime": 0
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15
    }
  }
}
```

#### GET /api/agents/:id

Get specific agent details.

**Response:**
```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "agent-translator-1",
      "name": "Translation Specialist Alpha",
      "description": "Expert in English-Vietnamese translation",
      "type": "translator",
      "specialization": ["en-vi", "technical_translation"],
      "status": "idle",
      "capabilities": ["translate", "quality_check", "context_analysis"],
      "performance": { /* Performance metrics */ },
      "configuration": {
        "model": "gpt-4",
        "parameters": {
          "temperature": 0.3,
          "top_p": 0.9
        },
        "personality": {
          "traits": {
            "confidence": 0.85,
            "creativity": 0.7,
            "attention_to_detail": 0.95
          },
          "communication_style": "professional"
        }
      },
      "collaboration": {
        "active_collaborations": ["collab-session-1"],
        "reputation": {
          "as_leader": 0.89,
          "as_contributor": 0.95,
          "reliability": 0.96
        },
        "preferences": {
          "max_group_size": 4,
          "preferred_roles": ["primary_translator"]
        }
      },
      "learning": {
        "adaptation_rate": 0.82,
        "learning_efficiency": 0.87,
        "knowledge_base": ["translation_patterns", "quality_metrics"]
      }
    }
  }
}
```

#### POST /api/agents/collaborate

Start agent collaboration session.

**Request Body:**
```json
{
  "agents": ["agent-translator-1", "agent-reviewer-1"],
  "task": {
    "type": "collaborative_translation",
    "title": "Technical Document Translation",
    "description": "Translate technical documentation with quality review",
    "input": {
      "text": "Technical documentation content...",
      "sourceLanguage": "en",
      "targetLanguage": "vi"
    },
    "requirements": ["technical_accuracy", "cultural_adaptation"],
    "qualityThreshold": 0.92
  },
  "configuration": {
    "collaborationMode": "sequential",
    "communicationProtocol": "structured",
    "timeoutDuration": 1800000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "collaboration": {
      "id": "collab-session-123",
      "title": "Technical Document Translation",
      "participants": ["agent-translator-1", "agent-reviewer-1"],
      "leader": "agent-translator-1",
      "status": "active",
      "estimatedDuration": 1800000,
      "createdAt": "2024-01-01T12:00:00Z",
      "communication": {
        "protocol": "structured",
        "lastActivity": "2024-01-01T12:00:00Z"
      }
    }
  }
}
```

#### GET /api/collaboration/sessions/:id

Get collaboration session details.

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "collab-session-123",
      "title": "Technical Document Translation",
      "participants": ["agent-translator-1", "agent-reviewer-1"],
      "leader": "agent-translator-1",
      "status": "in_progress",
      "progress": 65,
      "tasks": [
        {
          "id": "task-456",
          "title": "Initial Translation",
          "assignedTo": "agent-translator-1",
          "status": "completed",
          "progress": 100
        },
        {
          "id": "task-457",
          "title": "Quality Review",
          "assignedTo": "agent-reviewer-1",
          "status": "in_progress",
          "progress": 30
        }
      ],
      "communication": {
        "messages": [
          {
            "id": "msg-1",
            "sender": "agent-translator-1",
            "content": "Starting translation analysis...",
            "timestamp": "2024-01-01T12:00:00Z",
            "type": "status"
          },
          {
            "id": "msg-2",
            "sender": "agent-reviewer-1",
            "content": "Quality checkpoints established.",
            "timestamp": "2024-01-01T12:05:00Z",
            "type": "confirmation"
          }
        ]
      },
      "metrics": {
        "efficiency": 0.91,
        "quality": 0.94,
        "collaboration_score": 0.89
      }
    }
  }
}
```

#### POST /api/collaboration/sessions/:id/tasks

Create task within collaboration session.

**Request Body:**
```json
{
  "title": "Cultural Adaptation Review",
  "description": "Review translation for cultural appropriateness",
  "type": "quality_review",
  "assignedAgent": "agent-reviewer-1",
  "priority": "high",
  "input": {
    "originalText": "Source text...",
    "translatedText": "Translated text...",
    "reviewCriteria": ["cultural_adaptation", "tone_consistency"]
  },
  "estimatedDuration": 900000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "task-789",
      "title": "Cultural Adaptation Review",
      "status": "pending",
      "assignedAgent": "agent-reviewer-1",
      "priority": "high",
      "estimatedDuration": 900000,
      "createdAt": "2024-01-01T12:15:00Z"
    }
  }
}
```

#### GET /api/agents/metrics

Get swarm performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalAgents": 15,
      "activeAgents": 12,
      "totalCollaborations": 45,
      "averageEfficiency": 0.89,
      "networkHealth": 0.94,
      "responseTime": 380,
      "successRate": 0.96,
      "lastUpdate": "2024-01-01T12:00:00Z"
    },
    "performance": {
      "hourly": {
        "tasksCompleted": 120,
        "averageQuality": 0.92,
        "collaborationRate": 0.75
      },
      "daily": {
        "tasksCompleted": 2880,
        "averageQuality": 0.91,
        "collaborationRate": 0.73
      }
    },
    "trends": {
      "efficiency": "improving",
      "quality": "stable",
      "collaboration": "improving"
    }
  }
}
```

## Translation API

### Overview

The Translation API provides access to the multi-provider translation system with quality assessment and optimization.

### Endpoints

#### POST /api/translate

Translate text with optional parameters.

**Request Body:**
```json
{
  "text": "Hello, how are you today?",
  "sourceLanguage": "en",
  "targetLanguage": "vi",
  "options": {
    "provider": "openai",
    "model": "gpt-4",
    "includeAlternatives": true,
    "includeConfidence": true,
    "contextInfo": "casual conversation",
    "qualityThreshold": 0.9,
    "useCollaboration": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "translation-123",
    "translatedText": "Xin chào, hôm nay bạn thế nào?",
    "detectedLanguage": "en",
    "confidence": 0.95,
    "alternatives": [
      "Chào bạn, hôm nay bạn ra sao?",
      "Xin chào, bạn có khỏe không?"
    ],
    "metadata": {
      "provider": "openai",
      "model": "gpt-4",
      "processingTime": 1500,
      "charactersCount": 26,
      "wordsCount": 6,
      "cost": 0.002,
      "quality": {
        "fluency": 0.95,
        "accuracy": 0.92,
        "coherence": 0.98
      }
    },
    "usage": {
      "charactersUsed": 26,
      "charactersRemaining": 9974,
      "costEstimate": 0.002
    },
    "warnings": []
  }
}
```

#### POST /api/translate/batch

Translate multiple texts in batch.

**Request Body:**
```json
{
  "texts": [
    "Hello world",
    "How are you?",
    "Thank you very much"
  ],
  "sourceLanguage": "en",
  "targetLanguage": "vi",
  "options": {
    "provider": "openai",
    "preserveOrder": true,
    "parallelize": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "batch-123",
    "results": [
      {
        "index": 0,
        "originalText": "Hello world",
        "translatedText": "Xin chào thế giới",
        "confidence": 0.96
      },
      {
        "index": 1,
        "originalText": "How are you?",
        "translatedText": "Bạn khỏe không?",
        "confidence": 0.94
      },
      {
        "index": 2,
        "originalText": "Thank you very much",
        "translatedText": "Cảm ơn bạn rất nhiều",
        "confidence": 0.97
      }
    ],
    "summary": {
      "totalTexts": 3,
      "successfulTranslations": 3,
      "averageConfidence": 0.96,
      "totalProcessingTime": 3200,
      "totalCost": 0.005
    }
  }
}
```

#### GET /api/translations

Get translation history.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sourceLanguage` (optional): Filter by source language
- `targetLanguage` (optional): Filter by target language
- `startDate` (optional): Filter by start date (ISO string)
- `endDate` (optional): Filter by end date (ISO string)

**Response:**
```json
{
  "success": true,
  "data": {
    "translations": [
      {
        "id": "translation-123",
        "sourceText": "Hello world",
        "translatedText": "Xin chào thế giới",
        "sourceLanguage": "en",
        "targetLanguage": "vi",
        "confidence": 0.95,
        "status": "completed",
        "createdAt": "2024-01-01T12:00:00Z",
        "metadata": {
          "provider": "openai",
          "processingTime": 1500
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    },
    "summary": {
      "totalTranslations": 150,
      "uniqueLanguagePairs": 12,
      "averageConfidence": 0.93,
      "totalCharactersTranslated": 25000
    }
  }
}
```

#### GET /api/translations/:id

Get specific translation details.

**Response:**
```json
{
  "success": true,
  "data": {
    "translation": {
      "id": "translation-123",
      "sourceText": "Hello world",
      "translatedText": "Xin chào thế giới",
      "sourceLanguage": "en",
      "targetLanguage": "vi",
      "confidence": 0.95,
      "status": "completed",
      "alternatives": ["Chào thế giới"],
      "metadata": {
        "provider": "openai",
        "model": "gpt-4",
        "processingTime": 1500,
        "quality": {
          "fluency": 0.95,
          "accuracy": 0.92,
          "coherence": 0.98
        },
        "revisions": []
      },
      "userId": "user-123",
      "createdAt": "2024-01-01T12:00:00Z",
      "updatedAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

#### POST /api/translate/quality

Assess translation quality.

**Request Body:**
```json
{
  "sourceText": "Hello world",
  "translatedText": "Xin chào thế giới",
  "sourceLanguage": "en",
  "targetLanguage": "vi",
  "assessmentCriteria": ["fluency", "accuracy", "coherence", "cultural_adaptation"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assessment": {
      "id": "assessment-123",
      "overallScore": 0.94,
      "metrics": {
        "fluency": 0.95,
        "accuracy": 0.92,
        "coherence": 0.98,
        "cultural_adaptation": 0.91
      },
      "feedback": {
        "strengths": [
          "Natural fluency in target language",
          "Accurate meaning preservation"
        ],
        "improvements": [
          "Consider more colloquial expression",
          "Minor cultural adaptation possible"
        ]
      },
      "confidence": 0.88,
      "assessedAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

## Document Processing API

### Overview

The Document Processing API handles document upload, analysis, and translation with support for multiple formats.

### Endpoints

#### POST /api/documents/upload

Upload document for processing.

**Request Body (multipart/form-data):**
```
file: [file upload]
targetLanguages: ["vi", "es"]
options: {
  "extractText": true,
  "preserveFormatting": true,
  "enableOCR": true,
  "qualityThreshold": 0.9
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "doc-123",
      "name": "technical-manual.pdf",
      "originalName": "technical-manual.pdf",
      "type": "pdf",
      "size": 2048000,
      "url": "https://storage.example.com/documents/doc-123.pdf",
      "status": "processing",
      "targetLanguages": ["vi", "es"],
      "metadata": {
        "pageCount": 25,
        "wordCount": 5000,
        "language": "en",
        "quality": {
          "score": 0.92,
          "extractionQuality": 0.95
        }
      },
      "processing": {
        "stages": [
          {
            "name": "upload",
            "status": "completed",
            "duration": 2000
          },
          {
            "name": "extraction",
            "status": "in_progress",
            "progress": 45
          }
        ],
        "progress": 45,
        "estimatedCompletion": "2024-01-01T12:30:00Z"
      }
    },
    "uploadUrl": "https://storage.example.com/upload-endpoint",
    "processingJobId": "job-456"
  }
}
```

#### GET /api/documents

Get document list.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status
- `type` (optional): Filter by document type
- `startDate` (optional): Filter by upload date

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc-123",
        "name": "technical-manual.pdf",
        "type": "pdf",
        "size": 2048000,
        "status": "completed",
        "targetLanguages": ["vi", "es"],
        "createdAt": "2024-01-01T12:00:00Z",
        "metadata": {
          "pageCount": 25,
          "wordCount": 5000
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

#### GET /api/documents/:id

Get specific document details.

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "doc-123",
      "name": "technical-manual.pdf",
      "originalName": "technical-manual.pdf",
      "type": "pdf",
      "size": 2048000,
      "url": "https://storage.example.com/documents/doc-123.pdf",
      "status": "completed",
      "targetLanguages": ["vi", "es"],
      "content": {
        "extractedText": "Document content...",
        "structure": {
          "type": "hierarchical",
          "outline": [
            {
              "level": 1,
              "title": "Introduction",
              "page": 1
            },
            {
              "level": 2,
              "title": "Overview",
              "page": 2
            }
          ],
          "navigation": {
            "totalPages": 25,
            "bookmarks": [
              {
                "title": "Introduction",
                "page": 1
              }
            ]
          }
        },
        "pages": [
          {
            "number": 1,
            "width": 595,
            "height": 842,
            "thumbnail": "https://storage.example.com/thumbnails/page-1.jpg"
          }
        ]
      },
      "metadata": {
        "originalSize": 2048000,
        "pageCount": 25,
        "wordCount": 5000,
        "characterCount": 25000,
        "language": "en",
        "quality": {
          "score": 0.92,
          "extractionQuality": 0.95
        }
      },
      "processing": {
        "stages": [
          {
            "name": "upload",
            "status": "completed",
            "duration": 2000
          },
          {
            "name": "extraction",
            "status": "completed",
            "duration": 8000
          },
          {
            "name": "analysis",
            "status": "completed",
            "duration": 5000
          }
        ],
        "progress": 100,
        "completedAt": "2024-01-01T12:15:00Z"
      },
      "translations": [
        {
          "id": "translation-456",
          "language": "vi",
          "status": "completed",
          "confidence": 0.94,
          "url": "https://storage.example.com/translations/doc-123-vi.pdf"
        }
      ]
    }
  }
}
```

#### POST /api/documents/:id/translate

Start document translation.

**Request Body:**
```json
{
  "targetLanguage": "vi",
  "options": {
    "preserveFormatting": true,
    "useCollaboration": true,
    "qualityThreshold": 0.92,
    "priority": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "translationJob": {
      "id": "translation-job-789",
      "documentId": "doc-123",
      "targetLanguage": "vi",
      "status": "started",
      "estimatedDuration": 1800000,
      "assignedAgents": ["translator-alpha", "reviewer-beta"],
      "createdAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

#### GET /api/documents/:id/translations/:language

Get document translation for specific language.

**Response:**
```json
{
  "success": true,
  "data": {
    "translation": {
      "id": "translation-456",
      "documentId": "doc-123",
      "language": "vi",
      "status": "completed",
      "translatedText": "Translated document content...",
      "confidence": 0.94,
      "url": "https://storage.example.com/translations/doc-123-vi.pdf",
      "metadata": {
        "provider": "collaborative",
        "agents": ["translator-alpha", "reviewer-beta"],
        "processingTime": 1650000,
        "quality": {
          "fluency": 0.95,
          "accuracy": 0.93,
          "consistency": 0.94
        }
      },
      "createdAt": "2024-01-01T12:00:00Z",
      "completedAt": "2024-01-01T12:27:30Z"
    }
  }
}
```

#### POST /api/documents/batch

Start batch document processing.

**Request Body (multipart/form-data):**
```
files: [multiple file uploads]
commonTargetLanguages: ["vi", "es"]
options: {
  "processingMode": "parallel",
  "priority": "normal",
  "preserveFormatting": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batch": {
      "id": "batch-789",
      "totalFiles": 5,
      "estimatedDuration": 3600000,
      "processingMode": "parallel",
      "status": "started",
      "documents": [
        {
          "id": "doc-124",
          "name": "file1.pdf",
          "status": "queued"
        },
        {
          "id": "doc-125",
          "name": "file2.docx",
          "status": "queued"
        }
      ],
      "createdAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

#### GET /api/documents/batch/:batchId

Get batch processing status.

**Response:**
```json
{
  "success": true,
  "data": {
    "batch": {
      "id": "batch-789",
      "totalFiles": 5,
      "completedFiles": 3,
      "failedFiles": 0,
      "progress": 60,
      "status": "in_progress",
      "estimatedCompletion": "2024-01-01T13:00:00Z",
      "results": [
        {
          "documentId": "doc-124",
          "name": "file1.pdf",
          "status": "completed",
          "translations": [
            {
              "language": "vi",
              "status": "completed",
              "confidence": 0.94
            }
          ]
        },
        {
          "documentId": "doc-125",
          "name": "file2.docx",
          "status": "in_progress",
          "progress": 75
        }
      ]
    }
  }
}
```

## Performance Monitoring API

### Overview

The Performance Monitoring API provides access to performance metrics, monitoring data, and optimization insights.

### Endpoints

#### GET /api/performance/metrics

Get current performance metrics.

**Query Parameters:**
- `category` (optional): Filter by metric category
- `timeRange` (optional): Time range for metrics (1h, 24h, 7d, 30d)
- `aggregation` (optional): Aggregation method (avg, max, min, sum)

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "rendering": {
        "averageRenderTime": 12.5,
        "p95RenderTime": 45.2,
        "slowComponents": 3,
        "totalRenders": 1520
      },
      "memory": {
        "currentUsage": 52428800,
        "peakUsage": 67108864,
        "growthRate": 1024,
        "leakCount": 0
      },
      "network": {
        "totalRequests": 245,
        "averageResponseTime": 380,
        "cacheHitRate": 0.73,
        "errorRate": 0.02
      },
      "bundle": {
        "totalSize": 512000,
        "gzipSize": 153600,
        "compressionRatio": 0.3,
        "loadTime": 890
      }
    },
    "summary": {
      "overallScore": 85,
      "trend": "improving",
      "criticalIssues": 0,
      "recommendations": 2
    },
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

#### POST /api/performance/metrics

Record custom performance metric.

**Request Body:**
```json
{
  "name": "Translation Processing Time",
  "value": 2500,
  "unit": "ms",
  "category": "ai_processing",
  "severity": "medium",
  "metadata": {
    "provider": "openai",
    "model": "gpt-4",
    "languagePair": "en-vi"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metric": {
      "id": "metric-123",
      "name": "Translation Processing Time",
      "value": 2500,
      "recorded": true,
      "timestamp": "2024-01-01T12:00:00Z"
    }
  }
}
```

#### GET /api/performance/analysis

Get performance analysis and insights.

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "score": 85,
      "confidence": 0.92,
      "trends": {
        "rendering": "stable",
        "memory": "improving",
        "network": "degrading"
      },
      "bottlenecks": [
        {
          "type": "network",
          "description": "Slow API responses detected",
          "impact": "medium",
          "affected_endpoints": ["/api/translate"]
        }
      ],
      "optimizations": [
        {
          "type": "caching",
          "priority": "high",
          "description": "Implement response caching for translation API",
          "estimatedImprovement": 0.25,
          "effort": "medium"
        }
      ],
      "alerts": [
        {
          "level": "warning",
          "message": "Memory usage approaching threshold",
          "metric": "memory_usage",
          "value": 85,
          "threshold": 90
        }
      ]
    }
  }
}
```

#### GET /api/performance/components

Get component performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "components": [
      {
        "name": "SimpleTranslationInterface",
        "renderCount": 45,
        "averageRenderTime": 15.2,
        "maxRenderTime": 67.8,
        "memoryUsage": 2048000,
        "optimizationSuggestions": [
          "Consider using React.memo for props optimization",
          "Use useMemo for expensive calculations"
        ],
        "performanceScore": 78,
        "trend": "stable"
      },
      {
        "name": "DocumentPreview",
        "renderCount": 23,
        "averageRenderTime": 28.7,
        "maxRenderTime": 156.3,
        "memoryUsage": 4096000,
        "optimizationSuggestions": [
          "Implement virtual scrolling for large documents",
          "Lazy load document pages"
        ],
        "performanceScore": 65,
        "trend": "degrading"
      }
    ],
    "summary": {
      "totalComponents": 25,
      "slowComponents": 3,
      "averageScore": 82,
      "needingOptimization": 5
    }
  }
}
```

## Error Handling

### Standard Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details",
    "field": "fieldName", // For validation errors
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req-123-456-789"
  }
}
```

### Common Error Codes

#### Authentication Errors (401)
- `UNAUTHORIZED`: Missing or invalid authentication token
- `TOKEN_EXPIRED`: JWT token has expired
- `INVALID_CREDENTIALS`: Invalid email/password combination
- `ACCOUNT_DISABLED`: User account is disabled

#### Authorization Errors (403)
- `FORBIDDEN`: Insufficient permissions for requested action
- `SUBSCRIPTION_REQUIRED`: Feature requires active subscription
- `RATE_LIMIT_EXCEEDED`: API rate limit exceeded

#### Validation Errors (400)
- `VALIDATION_ERROR`: Request data validation failed
- `MISSING_REQUIRED_FIELD`: Required field is missing
- `INVALID_FORMAT`: Data format is invalid
- `FILE_TOO_LARGE`: Uploaded file exceeds size limit

#### Resource Errors (404)
- `NOT_FOUND`: Requested resource not found
- `DOCUMENT_NOT_FOUND`: Document not found
- `TRANSLATION_NOT_FOUND`: Translation not found
- `AGENT_NOT_FOUND`: AI agent not found

#### Processing Errors (422)
- `PROCESSING_FAILED`: Document processing failed
- `TRANSLATION_FAILED`: Translation failed
- `COLLABORATION_FAILED`: Agent collaboration failed
- `QUALITY_THRESHOLD_NOT_MET`: Quality below threshold

#### Server Errors (500)
- `INTERNAL_ERROR`: Internal server error
- `SERVICE_UNAVAILABLE`: External service unavailable
- `TIMEOUT`: Request timeout
- `STORAGE_ERROR`: File storage error

### Error Handling Best Practices

1. **Always check the `success` field** in responses
2. **Handle errors gracefully** with user-friendly messages
3. **Implement retry logic** for transient errors
4. **Log error details** for debugging purposes
5. **Show appropriate UI feedback** for different error types

Example error handling:

```typescript
try {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  })
  
  const result = await response.json()
  
  if (!result.success) {
    switch (result.error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        // Show rate limit message and retry after delay
        setTimeout(() => retryRequest(), 60000)
        break
      case 'TRANSLATION_FAILED':
        // Show translation error message
        showError('Translation failed. Please try again.')
        break
      default:
        // Generic error handling
        showError(result.error.message)
    }
    return
  }
  
  // Handle successful response
  handleTranslationResult(result.data)
  
} catch (error) {
  // Handle network or parsing errors
  showError('Network error. Please check your connection.')
}
```

## Rate Limiting

### Rate Limits by Endpoint Category

| Category | Authenticated | Unauthenticated |
|----------|--------------|-----------------|
| Translation | 1000/hour | 10/hour |
| Document Processing | 100/hour | 5/hour |
| AI Agent Collaboration | 500/hour | N/A |
| Performance Metrics | 10000/hour | N/A |

### Rate Limit Headers

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "details": "You have exceeded the rate limit of 1000 requests per hour",
    "retryAfter": 3600,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

---

This API reference provides comprehensive documentation for all Prismy platform endpoints. For additional information or support, please contact the development team or refer to the technical documentation.