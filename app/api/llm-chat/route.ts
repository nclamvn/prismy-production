import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Calculate credits cost based on tokens (1 credit = 750 tokens)
function calculateCredits(tokens: number): number {
  return Math.ceil(tokens / 750)
}

// Mock LLM response generator (replace with actual LLM API)
async function* generateLLMResponse(_prompt: string, _documentContext: string) {
  const responses = [
    "I understand you're asking about the document. Let me analyze the content...",
    ' Based on my review of the document, here are the key points:',
    ' • The document contains important information about the topic',
    ' • There are several sections that address your specific question',
    ' • The main conclusions can be summarized as follows...',
    " Is there anything specific you'd like me to clarify or expand upon?",
  ]

  let totalTokens = 0

  for (const chunk of responses) {
    // Simulate token count (rough approximation: 1 token = 4 chars)
    const chunkTokens = Math.ceil(chunk.length / 4)
    totalTokens += chunkTokens

    yield {
      type: 'content',
      content: chunk,
      tokens: chunkTokens,
      totalTokens,
    }

    // Simulate streaming delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
  }

  // Final metadata
  yield {
    type: 'done',
    totalTokens,
    credits: calculateCredits(totalTokens),
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    // Get user session and session ID
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const sessionId = request.cookies.get('session_id')?.value

    if (!session?.user?.id && !sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    const {
      jobId,
      prompt,
      model: _model = 'gpt-3.5-turbo',
    } = await request.json()

    if (!jobId || !prompt) {
      return NextResponse.json(
        { error: 'Job ID and prompt required' },
        { status: 400 }
      )
    }

    // Get job and verify it's translated
    const { data: job, error: jobError } = await supabase
      .from('translation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq(
        session?.user?.id ? 'user_id' : 'session_id',
        session?.user?.id || sessionId
      )
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status !== 'translated') {
      return NextResponse.json(
        { error: 'Document must be translated first' },
        { status: 400 }
      )
    }

    // Check credits before starting
    const { data: creditsData, error: creditsError } = await supabase.rpc(
      'get_or_create_credits',
      {
        p_user_id: session?.user?.id || null,
        p_session_id: session?.user?.id ? null : sessionId,
      }
    )

    if (creditsError || !creditsData || creditsData.length === 0) {
      return NextResponse.json(
        { error: 'Failed to check credits' },
        { status: 500 }
      )
    }

    const currentCredits = creditsData[0]
    if (currentCredits.credits_left <= 0) {
      return NextResponse.json(
        {
          error: 'No credits remaining',
          credits: currentCredits.credits_left,
        },
        { status: 402 }
      )
    }

    // Create Server-Sent Events stream
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Save user message
          await supabase.from('chat_messages').insert({
            job_id: jobId,
            role: 'user',
            content: prompt,
            tokens: Math.ceil(prompt.length / 4),
            credits_cost: 0,
          })

          let assistantMessage = ''
          let totalTokens = 0
          let totalCredits = 0

          // Stream LLM response
          for await (const chunk of generateLLMResponse(
            prompt,
            'Document context here'
          )) {
            if (chunk.type === 'content') {
              assistantMessage += chunk.content
              totalTokens = chunk.totalTokens

              // Send streaming chunk
              const data = JSON.stringify({
                type: 'content',
                content: chunk.content,
                tokens: chunk.tokens,
                totalTokens: chunk.totalTokens,
              })

              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            } else if (chunk.type === 'done') {
              totalTokens = chunk.totalTokens
              totalCredits = chunk.credits

              // Try to reserve credits
              const { data: reserveSuccess } = await supabase.rpc(
                'reserve_credits',
                {
                  p_user_id: session?.user?.id || null,
                  p_session_id: session?.user?.id ? null : sessionId,
                  p_cost: totalCredits,
                }
              )

              if (!reserveSuccess) {
                // Credits exhausted during generation
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'error',
                      error: 'Credits exhausted during generation',
                      partial: true,
                    })}\n\n`
                  )
                )

                controller.close()
                return
              }

              // Save assistant message
              await supabase.from('chat_messages').insert({
                job_id: jobId,
                role: 'assistant',
                content: assistantMessage,
                tokens: totalTokens,
                credits_cost: totalCredits,
              })

              // Get updated credits
              const { data: updatedCredits } = await supabase.rpc(
                'get_or_create_credits',
                {
                  p_user_id: session?.user?.id || null,
                  p_session_id: session?.user?.id ? null : sessionId,
                }
              )

              // Send completion message
              const finalData = JSON.stringify({
                type: 'done',
                totalTokens,
                credits: {
                  used: totalCredits,
                  remaining: updatedCredits?.[0]?.credits_left || 0,
                },
              })

              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
            }
          }

          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          const errorData = JSON.stringify({
            type: 'error',
            error: 'Failed to generate response',
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('LLM chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
