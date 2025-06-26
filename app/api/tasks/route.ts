import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

interface CreateTaskRequest {
  type: 'translate' | 'summarize' | 'qa'
  metadata: {
    fileName?: string
    fileSize?: number
    textLength?: number
    targetLang?: string
    serviceType?: 'google_translate' | 'llm'
  }
}

// Credit costs per task type
const CREDIT_COSTS = {
  translate: {
    google_translate: 30, // per page
    llm: 500 // per page
  },
  summarize: 100, // per document
  qa: 50 // per question
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Task creation API called')

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: CreateTaskRequest = await request.json()
    
    if (!body.type || !body.metadata) {
      return NextResponse.json(
        { error: 'Task type and metadata are required' },
        { status: 400 }
      )
    }

    // Calculate credit cost
    let creditCost = 0
    
    if (body.type === 'translate') {
      const serviceType = body.metadata.serviceType || 'google_translate'
      const textLength = body.metadata.textLength || 0
      const wordsPerPage = 500
      const pageCount = Math.ceil(textLength / (wordsPerPage * 5)) // Rough estimate: 5 chars per word
      creditCost = pageCount * CREDIT_COSTS.translate[serviceType]
    } else if (body.type === 'summarize') {
      creditCost = CREDIT_COSTS.summarize
    } else if (body.type === 'qa') {
      creditCost = CREDIT_COSTS.qa
    }

    // Minimum cost of 1 credit
    creditCost = Math.max(creditCost, 1)

    // Check user's credit balance
    const { data: balanceData, error: balanceError } = await supabase
      .rpc('get_user_credit_balance', { p_user_id: user.id })
      .single()

    if (balanceError) {
      console.error('Error checking credit balance:', balanceError)
      return NextResponse.json(
        { error: 'Failed to check credit balance' },
        { status: 500 }
      )
    }

    const currentBalance = balanceData?.balance || 0

    if (currentBalance < creditCost) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          required: creditCost,
          current: currentBalance,
          message: 'Please upgrade your plan to continue'
        },
        { status: 402 }
      )
    }

    // Create task record
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        type: body.type,
        cost: creditCost,
        status: 'queued',
        metadata: body.metadata
      })
      .select()
      .single()

    if (taskError) {
      console.error('Error creating task:', taskError)
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      )
    }

    console.log('✅ Task created successfully', {
      taskId: task.id,
      type: body.type,
      creditCost,
      userId: user.id
    })

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        type: task.type,
        cost: creditCost,
        status: task.status,
        created_at: task.created_at
      },
      credits: {
        required: creditCost,
        remaining: currentBalance - creditCost
      }
    })

  } catch (error) {
    console.error('❌ Task creation API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Task creation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tasks: tasks || []
    })

  } catch (error) {
    console.error('❌ Tasks fetch API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Tasks fetch failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}