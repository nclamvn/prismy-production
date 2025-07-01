/**
 * Custom Auto Scaling Lambda Function
 * Intelligent scaling based on business metrics and patterns
 */

const AWS = require('aws-sdk');

const ecs = new AWS.ECS();
const cloudwatch = new AWS.CloudWatch();
const appAutoscaling = new AWS.ApplicationAutoScaling();

// Configuration from environment variables
const CLUSTER_NAME = process.env.CLUSTER_NAME;
const SERVICE_NAME = process.env.SERVICE_NAME;
const MIN_CAPACITY = parseInt(process.env.MIN_CAPACITY) || 2;
const MAX_CAPACITY = parseInt(process.env.MAX_CAPACITY) || 20;

// Scaling thresholds and parameters
const SCALING_CONFIG = {
  // CPU-based scaling
  cpu: {
    scaleUpThreshold: 70,
    scaleDownThreshold: 30,
    scaleUpAdjustment: 2,
    scaleDownAdjustment: -1,
  },
  
  // Memory-based scaling
  memory: {
    scaleUpThreshold: 80,
    scaleDownThreshold: 40,
    scaleUpAdjustment: 2,
    scaleDownAdjustment: -1,
  },
  
  // Request-based scaling
  requests: {
    scaleUpThreshold: 1000, // requests per minute per task
    scaleDownThreshold: 200,
    scaleUpAdjustment: 3,
    scaleDownAdjustment: -1,
  },
  
  // Queue-based scaling (for workers)
  queue: {
    scaleUpThreshold: 100, // messages in queue
    scaleDownThreshold: 10,
    scaleUpAdjustment: 2,
    scaleDownAdjustment: -1,
  },
  
  // Business hours scaling
  businessHours: {
    enabled: true,
    timezone: 'UTC',
    weekdays: {
      start: 7, // 7 AM
      end: 19,  // 7 PM
      minCapacity: 4,
    },
    weekends: {
      minCapacity: 2,
    },
  },
  
  // Cooldown periods (in seconds)
  cooldown: {
    scaleUp: 300,   // 5 minutes
    scaleDown: 600, // 10 minutes
  },
};

exports.handler = async (event) => {
  console.log('Starting custom scaling evaluation', { event });
  
  try {
    // Get current service state
    const serviceState = await getCurrentServiceState();
    console.log('Current service state:', serviceState);
    
    // Get metrics for scaling decision
    const metrics = await getScalingMetrics();
    console.log('Scaling metrics:', metrics);
    
    // Make scaling decision
    const scalingDecision = await makeScalingDecision(serviceState, metrics);
    console.log('Scaling decision:', scalingDecision);
    
    // Execute scaling action if needed
    if (scalingDecision.action !== 'none') {
      await executeScalingAction(scalingDecision);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        serviceState,
        metrics,
        scalingDecision,
      }),
    };
    
  } catch (error) {
    console.error('Error in custom scaling function:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};

/**
 * Get current ECS service state
 */
async function getCurrentServiceState() {
  const params = {
    cluster: CLUSTER_NAME,
    services: [SERVICE_NAME],
  };
  
  const result = await ecs.describeServices(params).promise();
  const service = result.services[0];
  
  if (!service) {
    throw new Error(`Service ${SERVICE_NAME} not found in cluster ${CLUSTER_NAME}`);
  }
  
  return {
    desiredCount: service.desiredCount,
    runningCount: service.runningCount,
    pendingCount: service.pendingCount,
    status: service.status,
    lastScalingActivity: await getLastScalingActivity(),
  };
}

/**
 * Get metrics for scaling decisions
 */
async function getScalingMetrics() {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 10 * 60 * 1000); // 10 minutes ago
  
  const metrics = {};
  
  // Get CPU utilization
  metrics.cpu = await getMetric('AWS/ECS', 'CPUUtilization', startTime, endTime, {
    ServiceName: SERVICE_NAME,
    ClusterName: CLUSTER_NAME,
  });
  
  // Get memory utilization
  metrics.memory = await getMetric('AWS/ECS', 'MemoryUtilization', startTime, endTime, {
    ServiceName: SERVICE_NAME,
    ClusterName: CLUSTER_NAME,
  });
  
  // Get ALB request count
  metrics.requests = await getMetric('AWS/ApplicationELB', 'RequestCountPerTarget', startTime, endTime, {
    TargetGroup: getTargetGroupFromServiceName(SERVICE_NAME),
  });
  
  // Get custom queue metrics
  metrics.queueDepth = await getMetric('Prismy/Application', 'QueueDepth', startTime, endTime, {
    QueueName: 'translation-jobs',
  });
  
  // Get business metrics
  metrics.activeUsers = await getMetric('Prismy/Application', 'ActiveUsers', startTime, endTime);
  
  return metrics;
}

/**
 * Get a specific CloudWatch metric
 */
async function getMetric(namespace, metricName, startTime, endTime, dimensions = {}) {
  const params = {
    Namespace: namespace,
    MetricName: metricName,
    StartTime: startTime,
    EndTime: endTime,
    Period: 300, // 5 minutes
    Statistics: ['Average', 'Maximum'],
    Dimensions: Object.entries(dimensions).map(([name, value]) => ({
      Name: name,
      Value: value,
    })),
  };
  
  try {
    const result = await cloudwatch.getMetricStatistics(params).promise();
    
    if (result.Datapoints.length === 0) {
      return { average: 0, maximum: 0, datapoints: 0 };
    }
    
    const latest = result.Datapoints.sort((a, b) => b.Timestamp - a.Timestamp)[0];
    const average = result.Datapoints.reduce((sum, dp) => sum + dp.Average, 0) / result.Datapoints.length;
    const maximum = Math.max(...result.Datapoints.map(dp => dp.Maximum));
    
    return {
      latest: latest.Average,
      average,
      maximum,
      datapoints: result.Datapoints.length,
    };
  } catch (error) {
    console.warn(`Failed to get metric ${namespace}/${metricName}:`, error.message);
    return { average: 0, maximum: 0, datapoints: 0 };
  }
}

/**
 * Make intelligent scaling decision
 */
async function makeScalingDecision(serviceState, metrics) {
  const currentCapacity = serviceState.desiredCount;
  const decision = {
    action: 'none',
    reason: 'No scaling needed',
    currentCapacity,
    targetCapacity: currentCapacity,
    confidence: 0,
  };
  
  // Check if we're in cooldown period
  if (await isInCooldownPeriod(serviceState.lastScalingActivity)) {
    decision.reason = 'In cooldown period';
    return decision;
  }
  
  // Check business hours constraints
  const businessHoursConstraint = getBusinessHoursConstraint();
  const minCapacity = Math.max(MIN_CAPACITY, businessHoursConstraint.minCapacity);
  const maxCapacity = MAX_CAPACITY;
  
  // Evaluate scaling signals
  const signals = evaluateScalingSignals(metrics, currentCapacity);
  console.log('Scaling signals:', signals);
  
  // Calculate overall scaling score
  const scalingScore = calculateScalingScore(signals);
  console.log('Scaling score:', scalingScore);
  
  // Make decision based on score
  if (scalingScore > 0.7 && currentCapacity < maxCapacity) {
    // Scale up
    const adjustment = getScaleUpAdjustment(signals, scalingScore);
    decision.action = 'scale_up';
    decision.targetCapacity = Math.min(maxCapacity, currentCapacity + adjustment);
    decision.reason = `High load detected (score: ${scalingScore.toFixed(2)})`;
    decision.confidence = scalingScore;
  } else if (scalingScore < -0.5 && currentCapacity > minCapacity) {
    // Scale down
    const adjustment = getScaleDownAdjustment(signals, Math.abs(scalingScore));
    decision.action = 'scale_down';
    decision.targetCapacity = Math.max(minCapacity, currentCapacity - adjustment);
    decision.reason = `Low load detected (score: ${scalingScore.toFixed(2)})`;
    decision.confidence = Math.abs(scalingScore);
  }
  
  // Safety checks
  if (decision.targetCapacity === currentCapacity) {
    decision.action = 'none';
    decision.reason = 'Target capacity equals current capacity';
  }
  
  return decision;
}

/**
 * Evaluate scaling signals from metrics
 */
function evaluateScalingSignals(metrics, currentCapacity) {
  const signals = {
    cpu: 0,
    memory: 0,
    requests: 0,
    queue: 0,
    activeUsers: 0,
  };
  
  // CPU signal
  if (metrics.cpu.datapoints > 0) {
    if (metrics.cpu.average > SCALING_CONFIG.cpu.scaleUpThreshold) {
      signals.cpu = (metrics.cpu.average - SCALING_CONFIG.cpu.scaleUpThreshold) / 30; // Normalize to 0-1
    } else if (metrics.cpu.average < SCALING_CONFIG.cpu.scaleDownThreshold) {
      signals.cpu = (metrics.cpu.average - SCALING_CONFIG.cpu.scaleDownThreshold) / 30; // Negative value
    }
  }
  
  // Memory signal
  if (metrics.memory.datapoints > 0) {
    if (metrics.memory.average > SCALING_CONFIG.memory.scaleUpThreshold) {
      signals.memory = (metrics.memory.average - SCALING_CONFIG.memory.scaleUpThreshold) / 20;
    } else if (metrics.memory.average < SCALING_CONFIG.memory.scaleDownThreshold) {
      signals.memory = (metrics.memory.average - SCALING_CONFIG.memory.scaleDownThreshold) / 40;
    }
  }
  
  // Requests per task signal
  if (metrics.requests.datapoints > 0) {
    const requestsPerTask = metrics.requests.average / currentCapacity;
    if (requestsPerTask > SCALING_CONFIG.requests.scaleUpThreshold) {
      signals.requests = (requestsPerTask - SCALING_CONFIG.requests.scaleUpThreshold) / 500;
    } else if (requestsPerTask < SCALING_CONFIG.requests.scaleDownThreshold) {
      signals.requests = (requestsPerTask - SCALING_CONFIG.requests.scaleDownThreshold) / 200;
    }
  }
  
  // Queue depth signal
  if (metrics.queueDepth.datapoints > 0) {
    if (metrics.queueDepth.average > SCALING_CONFIG.queue.scaleUpThreshold) {
      signals.queue = (metrics.queueDepth.average - SCALING_CONFIG.queue.scaleUpThreshold) / 100;
    } else if (metrics.queueDepth.average < SCALING_CONFIG.queue.scaleDownThreshold) {
      signals.queue = (metrics.queueDepth.average - SCALING_CONFIG.queue.scaleDownThreshold) / 10;
    }
  }
  
  // Active users signal (leading indicator)
  if (metrics.activeUsers.datapoints > 0) {
    const usersPerTask = metrics.activeUsers.average / currentCapacity;
    if (usersPerTask > 50) { // Scale up if more than 50 users per task
      signals.activeUsers = (usersPerTask - 50) / 50;
    } else if (usersPerTask < 10) { // Scale down if less than 10 users per task
      signals.activeUsers = (usersPerTask - 10) / 10;
    }
  }
  
  return signals;
}

/**
 * Calculate overall scaling score
 */
function calculateScalingScore(signals) {
  // Weighted scoring
  const weights = {
    cpu: 0.3,
    memory: 0.25,
    requests: 0.25,
    queue: 0.15,
    activeUsers: 0.05,
  };
  
  let score = 0;
  let totalWeight = 0;
  
  Object.entries(signals).forEach(([signal, value]) => {
    if (value !== 0) {
      score += value * weights[signal];
      totalWeight += weights[signal];
    }
  });
  
  // Normalize by total weight of active signals
  return totalWeight > 0 ? score / totalWeight : 0;
}

/**
 * Get scale up adjustment based on signals and confidence
 */
function getScaleUpAdjustment(signals, confidence) {
  let baseAdjustment = 1;
  
  // Increase adjustment for high confidence
  if (confidence > 0.9) {
    baseAdjustment = 3;
  } else if (confidence > 0.8) {
    baseAdjustment = 2;
  }
  
  // Increase adjustment for queue pressure
  if (signals.queue > 0.8) {
    baseAdjustment += 1;
  }
  
  return baseAdjustment;
}

/**
 * Get scale down adjustment
 */
function getScaleDownAdjustment(signals, confidence) {
  // Be more conservative with scale down
  return confidence > 0.8 ? 2 : 1;
}

/**
 * Get business hours constraint
 */
function getBusinessHoursConstraint() {
  if (!SCALING_CONFIG.businessHours.enabled) {
    return { minCapacity: MIN_CAPACITY };
  }
  
  const now = new Date();
  const hour = now.getUTCHours();
  const isWeekend = now.getUTCDay() === 0 || now.getUTCDay() === 6;
  
  if (isWeekend) {
    return { minCapacity: SCALING_CONFIG.businessHours.weekends.minCapacity };
  }
  
  const isBusinessHours = hour >= SCALING_CONFIG.businessHours.weekdays.start && 
                         hour < SCALING_CONFIG.businessHours.weekdays.end;
  
  if (isBusinessHours) {
    return { minCapacity: SCALING_CONFIG.businessHours.weekdays.minCapacity };
  }
  
  return { minCapacity: MIN_CAPACITY };
}

/**
 * Check if we're in cooldown period
 */
async function isInCooldownPeriod(lastScalingActivity) {
  if (!lastScalingActivity) {
    return false;
  }
  
  const now = new Date();
  const timeSinceLastScaling = (now - lastScalingActivity.timestamp) / 1000;
  
  if (lastScalingActivity.action === 'scale_up') {
    return timeSinceLastScaling < SCALING_CONFIG.cooldown.scaleUp;
  } else if (lastScalingActivity.action === 'scale_down') {
    return timeSinceLastScaling < SCALING_CONFIG.cooldown.scaleDown;
  }
  
  return false;
}

/**
 * Get last scaling activity from service events or DynamoDB
 */
async function getLastScalingActivity() {
  // This would typically query a DynamoDB table or service events
  // For now, return null to disable cooldown checking
  return null;
}

/**
 * Execute scaling action
 */
async function executeScalingAction(decision) {
  console.log('Executing scaling action:', decision);
  
  const params = {
    ResourceId: `service/${CLUSTER_NAME}/${SERVICE_NAME}`,
    ScalableDimension: 'ecs:service:DesiredCount',
    ServiceNamespace: 'ecs',
  };
  
  try {
    // Update the desired count
    await appAutoscaling.putScalingPolicy({
      ...params,
      PolicyName: `custom-scaling-${Date.now()}`,
      PolicyType: 'StepScaling',
      StepScalingPolicyConfiguration: {
        AdjustmentType: 'ExactCapacity',
        Cooldown: decision.action === 'scale_up' ? 
          SCALING_CONFIG.cooldown.scaleUp : 
          SCALING_CONFIG.cooldown.scaleDown,
        StepAdjustments: [{
          MetricIntervalLowerBound: 0,
          ScalingAdjustment: decision.targetCapacity - decision.currentCapacity,
        }],
      },
    }).promise();
    
    // Record scaling activity
    await recordScalingActivity(decision);
    
    console.log('Scaling action executed successfully');
  } catch (error) {
    console.error('Failed to execute scaling action:', error);
    throw error;
  }
}

/**
 * Record scaling activity for cooldown tracking
 */
async function recordScalingActivity(decision) {
  // This would typically write to DynamoDB or CloudWatch Logs
  console.log('Recording scaling activity:', {
    timestamp: new Date(),
    action: decision.action,
    fromCapacity: decision.currentCapacity,
    toCapacity: decision.targetCapacity,
    reason: decision.reason,
    confidence: decision.confidence,
  });
}

/**
 * Helper function to get target group from service name
 */
function getTargetGroupFromServiceName(serviceName) {
  // This would map service names to target group ARNs
  // For now, return a placeholder
  return 'app/prismy-alb/1234567890/targetgroup/prismy-app-tg/1234567890';
}