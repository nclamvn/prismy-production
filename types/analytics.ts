// Analytics and Monitoring TypeScript definitions
// Comprehensive type system for data analytics and performance monitoring

import type { SupportedLanguage, WithId, WithTimestamps } from './index'

// Core Analytics Types
export interface AnalyticsEvent extends WithId, WithTimestamps {
  name: string
  category: EventCategory
  action: string
  label?: string
  value?: number
  properties: Record<string, any>
  userId?: string
  sessionId: string
  deviceId?: string
  userAgent?: string
  ipAddress?: string
  location?: GeoLocation
  referrer?: string
  page?: string
  timestamp: Date
  processed: boolean
}

export type EventCategory = 
  | 'user_interaction'
  | 'translation'
  | 'document'
  | 'ai_agent'
  | 'collaboration'
  | 'performance'
  | 'error'
  | 'business'
  | 'system'
  | 'security'

export interface GeoLocation {
  country: string
  region: string
  city: string
  latitude?: number
  longitude?: number
  timezone: string
}

// Performance Monitoring Types
export interface PerformanceMetric extends WithId, WithTimestamps {
  name: string
  type: MetricType
  value: number
  unit: string
  context: MetricContext
  dimensions: Record<string, string>
  tags: string[]
  source: string
  aggregation?: AggregationType
  threshold?: MetricThreshold
}

export type MetricType = 
  | 'counter'
  | 'gauge'
  | 'histogram'
  | 'summary'
  | 'timer'
  | 'rate'
  | 'percentage'

export interface MetricContext {
  service: string
  environment: 'development' | 'staging' | 'production'
  version: string
  region?: string
  datacenter?: string
  component?: string
  operation?: string
}

export type AggregationType = 
  | 'sum'
  | 'average'
  | 'median'
  | 'min'
  | 'max'
  | 'count'
  | 'rate'
  | 'percentile'

export interface MetricThreshold {
  warning: number
  critical: number
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
}

// User Analytics Types
export interface UserAnalytics {
  userId: string
  profile: UserProfile
  behavior: UserBehavior
  engagement: EngagementMetrics
  journey: UserJourney
  segments: UserSegment[]
  preferences: UserPreferences
  lifetime: LifetimeMetrics
}

export interface UserProfile {
  demographic: {
    age_range?: string
    location?: GeoLocation
    language: SupportedLanguage
    timezone: string
  }
  technology: {
    device_type: 'desktop' | 'mobile' | 'tablet'
    operating_system: string
    browser: string
    screen_resolution?: string
  }
  account: {
    created_at: Date
    plan_type: string
    subscription_status: string
    last_login: Date
    total_logins: number
  }
}

export interface UserBehavior {
  session_data: {
    total_sessions: number
    average_session_duration: number
    pages_per_session: number
    bounce_rate: number
  }
  feature_usage: {
    most_used_features: Array<{
      feature: string
      usage_count: number
      last_used: Date
    }>
    feature_adoption: Record<string, {
      adopted: boolean
      first_use: Date
      usage_frequency: 'daily' | 'weekly' | 'monthly' | 'rarely'
    }>
  }
  content_interaction: {
    translations: {
      total: number
      by_language: Record<string, number>
      average_length: number
    }
    documents: {
      uploaded: number
      processed: number
      shared: number
    }
    collaboration: {
      projects: number
      messages: number
      reviews: number
    }
  }
}

export interface EngagementMetrics {
  daily_active: boolean
  weekly_active: boolean
  monthly_active: boolean
  retention: {
    day_1: boolean
    day_7: boolean
    day_30: boolean
    day_90: boolean
  }
  engagement_score: number
  time_spent: {
    today: number
    this_week: number
    this_month: number
    total: number
  }
  actions_performed: {
    today: number
    this_week: number
    this_month: number
    total: number
  }
}

export interface UserJourney {
  stages: JourneyStage[]
  current_stage: string
  progression: {
    onboarding_completed: boolean
    feature_discovery: number
    proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  }
  touchpoints: Array<{
    channel: string
    timestamp: Date
    action: string
    outcome: 'positive' | 'negative' | 'neutral'
  }>
  milestones: Array<{
    name: string
    achieved: boolean
    achieved_at?: Date
    value: number
  }>
}

export interface JourneyStage {
  name: string
  description: string
  entry_criteria: string[]
  exit_criteria: string[]
  average_duration: number
  conversion_rate: number
  typical_actions: string[]
}

export interface UserSegment {
  id: string
  name: string
  description: string
  criteria: SegmentCriteria
  size: number
  characteristics: Record<string, any>
  created_at: Date
  last_updated: Date
}

export interface SegmentCriteria {
  demographic?: Record<string, any>
  behavioral?: Record<string, any>
  engagement?: Record<string, any>
  transactional?: Record<string, any>
  custom?: Record<string, any>
}

export interface UserPreferences {
  communication: {
    email_frequency: 'immediate' | 'daily' | 'weekly' | 'monthly' | 'never'
    notification_types: string[]
    preferred_channel: 'email' | 'push' | 'in_app' | 'sms'
  }
  content: {
    language: SupportedLanguage
    difficulty_level: 'beginner' | 'intermediate' | 'advanced'
    content_types: string[]
    topics_of_interest: string[]
  }
  ui_preferences: {
    theme: 'light' | 'dark' | 'auto'
    layout: 'compact' | 'comfortable' | 'spacious'
    sidebar_collapsed: boolean
    feature_hints: boolean
  }
}

export interface LifetimeMetrics {
  lifetime_value: number
  total_revenue: number
  acquisition_cost: number
  acquisition_channel: string
  acquisition_date: Date
  churn_risk: 'low' | 'medium' | 'high'
  predicted_ltv: number
  health_score: number
}

// Business Analytics Types
export interface BusinessMetrics {
  revenue: RevenueMetrics
  usage: UsageMetrics
  performance: PerformanceMetrics
  quality: QualityMetrics
  growth: GrowthMetrics
  efficiency: EfficiencyMetrics
  satisfaction: SatisfactionMetrics
}

export interface RevenueMetrics {
  total_revenue: number
  recurring_revenue: number
  new_revenue: number
  expansion_revenue: number
  churn_revenue: number
  average_revenue_per_user: number
  customer_lifetime_value: number
  revenue_by_plan: Record<string, number>
  revenue_by_region: Record<string, number>
  revenue_growth: {
    month_over_month: number
    quarter_over_quarter: number
    year_over_year: number
  }
}

export interface UsageMetrics {
  active_users: {
    daily: number
    weekly: number
    monthly: number
  }
  feature_adoption: Record<string, {
    total_users: number
    active_users: number
    adoption_rate: number
  }>
  api_usage: {
    total_calls: number
    successful_calls: number
    error_rate: number
    average_response_time: number
  }
  content_metrics: {
    translations_per_day: number
    documents_processed: number
    characters_processed: number
    languages_used: Record<string, number>
  }
}

export interface PerformanceMetrics {
  system_performance: {
    uptime: number
    average_response_time: number
    error_rate: number
    throughput: number
  }
  ai_performance: {
    translation_accuracy: number
    processing_speed: number
    agent_efficiency: number
    collaboration_success_rate: number
  }
  infrastructure: {
    cpu_utilization: number
    memory_utilization: number
    storage_utilization: number
    network_utilization: number
  }
}

export interface QualityMetrics {
  translation_quality: {
    average_score: number
    human_approval_rate: number
    revision_rate: number
    error_types: Record<string, number>
  }
  document_processing: {
    success_rate: number
    accuracy: number
    processing_time: number
    error_rate: number
  }
  user_satisfaction: {
    rating: number
    nps_score: number
    support_tickets: number
    resolution_time: number
  }
}

export interface GrowthMetrics {
  user_acquisition: {
    new_users: number
    acquisition_channels: Record<string, number>
    conversion_rate: number
    cost_per_acquisition: number
  }
  retention: {
    day_1: number
    day_7: number
    day_30: number
    day_90: number
    cohort_analysis: CohortData[]
  }
  expansion: {
    upgrade_rate: number
    feature_adoption_rate: number
    cross_sell_rate: number
    upsell_rate: number
  }
  churn: {
    churn_rate: number
    churn_reasons: Record<string, number>
    at_risk_users: number
    prevention_success_rate: number
  }
}

export interface CohortData {
  cohort: string
  period: number
  users: number
  retention_rate: number
  revenue: number
}

export interface EfficiencyMetrics {
  operational: {
    support_efficiency: number
    development_velocity: number
    deployment_frequency: number
    lead_time: number
  }
  cost_efficiency: {
    cost_per_transaction: number
    infrastructure_cost_ratio: number
    support_cost_per_user: number
    marketing_efficiency: number
  }
  resource_utilization: {
    agent_utilization: number
    server_utilization: number
    license_utilization: number
    feature_utilization: Record<string, number>
  }
}

export interface SatisfactionMetrics {
  customer_satisfaction: {
    csat_score: number
    nps_score: number
    ces_score: number
    feedback_sentiment: number
  }
  product_satisfaction: {
    feature_ratings: Record<string, number>
    usability_score: number
    reliability_score: number
    performance_satisfaction: number
  }
  support_satisfaction: {
    response_time_satisfaction: number
    resolution_satisfaction: number
    agent_satisfaction: number
    self_service_success_rate: number
  }
}

// Query and Reporting Types
export interface AnalyticsQuery {
  metrics: string[]
  dimensions?: string[]
  filters?: QueryFilter[]
  date_range: DateRange
  granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  sort?: QuerySort[]
  limit?: number
  offset?: number
  aggregation?: AggregationType
}

export interface QueryFilter {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in'
  value: any
}

export interface DateRange {
  start: Date
  end: Date
  timezone?: string
}

export interface QuerySort {
  field: string
  direction: 'asc' | 'desc'
}

export interface AnalyticsResponse {
  data: DataPoint[]
  metadata: ResponseMetadata
  summary: SummaryStatistics
}

export interface DataPoint {
  timestamp?: Date
  dimensions: Record<string, string>
  metrics: Record<string, number>
}

export interface ResponseMetadata {
  query: AnalyticsQuery
  execution_time: number
  data_freshness: Date
  sample_size: number
  confidence_level?: number
}

export interface SummaryStatistics {
  total_records: number
  unique_dimensions: Record<string, number>
  metric_summaries: Record<string, {
    sum: number
    average: number
    min: number
    max: number
    median: number
    std_deviation: number
  }>
}

// Dashboard and Visualization Types
export interface Dashboard extends WithId, WithTimestamps {
  name: string
  description?: string
  category: 'executive' | 'operational' | 'analytical' | 'real_time'
  widgets: DashboardWidget[]
  layout: DashboardLayout
  filters: DashboardFilter[]
  refresh_interval: number
  access_level: 'public' | 'private' | 'team' | 'organization'
  shared_with: string[]
  tags: string[]
  is_favorite: boolean
  last_viewed: Date
}

export interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  query: AnalyticsQuery
  visualization: VisualizationConfig
  position: WidgetPosition
  size: WidgetSize
  settings: WidgetSettings
  data_source: string
  refresh_rate: number
  alerts?: WidgetAlert[]
}

export type WidgetType = 
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'scatter_plot'
  | 'heatmap'
  | 'table'
  | 'metric'
  | 'gauge'
  | 'funnel'
  | 'sankey'
  | 'treemap'

export interface VisualizationConfig {
  chart_type: WidgetType
  x_axis?: AxisConfig
  y_axis?: AxisConfig
  series?: SeriesConfig[]
  colors?: string[]
  styling?: Record<string, any>
  interactions?: InteractionConfig
}

export interface AxisConfig {
  field: string
  label: string
  type: 'linear' | 'log' | 'time' | 'category'
  format?: string
  min?: number
  max?: number
}

export interface SeriesConfig {
  field: string
  label: string
  type: 'line' | 'bar' | 'area'
  color?: string
  aggregate?: AggregationType
}

export interface InteractionConfig {
  zoom: boolean
  pan: boolean
  hover: boolean
  click: boolean
  brush: boolean
  drill_down?: string[]
}

export interface WidgetPosition {
  row: number
  column: number
}

export interface WidgetSize {
  width: number
  height: number
}

export interface WidgetSettings {
  show_legend: boolean
  show_tooltips: boolean
  show_grid: boolean
  animation: boolean
  responsive: boolean
  export_enabled: boolean
}

export interface WidgetAlert {
  id: string
  name: string
  condition: AlertCondition
  threshold: number
  severity: 'info' | 'warning' | 'critical'
  notification: AlertNotification
  is_active: boolean
}

export interface AlertCondition {
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  value: number
  duration?: number
  frequency?: number
}

export interface AlertNotification {
  channels: ('email' | 'slack' | 'webhook' | 'in_app')[]
  recipients: string[]
  message_template?: string
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'masonry'
  columns: number
  gap: number
  responsive_breakpoints: Record<string, number>
}

export interface DashboardFilter {
  field: string
  type: 'select' | 'multi_select' | 'date_range' | 'text' | 'numeric_range'
  label: string
  options?: Array<{
    value: any
    label: string
  }>
  default_value?: any
  applies_to: string[]
}

// Real-time Analytics Types
export interface RealTimeMetrics {
  current_users: number
  active_sessions: number
  events_per_second: number
  api_calls_per_minute: number
  error_rate: number
  average_response_time: number
  system_health: 'healthy' | 'warning' | 'critical'
  alerts: ActiveAlert[]
  trending: TrendingData[]
}

export interface ActiveAlert {
  id: string
  type: 'performance' | 'error' | 'usage' | 'security'
  severity: 'info' | 'warning' | 'critical'
  message: string
  timestamp: Date
  acknowledged: boolean
  source: string
}

export interface TrendingData {
  metric: string
  current_value: number
  previous_value: number
  change_percentage: number
  trend: 'up' | 'down' | 'stable'
  significance: 'high' | 'medium' | 'low'
}

// Context and Hook Types
export interface AnalyticsContextValue {
  metrics: PerformanceMetric[]
  dashboards: Dashboard[]
  real_time: RealTimeMetrics
  actions: {
    trackEvent: (event: Partial<AnalyticsEvent>) => Promise<void>
    recordMetric: (metric: Partial<PerformanceMetric>) => Promise<void>
    queryAnalytics: (query: AnalyticsQuery) => Promise<AnalyticsResponse>
    createDashboard: (dashboard: Partial<Dashboard>) => Promise<Dashboard>
    updateDashboard: (id: string, updates: Partial<Dashboard>) => Promise<Dashboard>
    deleteDashboard: (id: string) => Promise<void>
    exportData: (query: AnalyticsQuery, format: 'csv' | 'json' | 'excel') => Promise<Blob>
  }
}

export interface UseAnalytics {
  trackEvent: (event: Partial<AnalyticsEvent>) => Promise<void>
  recordMetric: (metric: Partial<PerformanceMetric>) => Promise<void>
  queryMetrics: (query: AnalyticsQuery) => Promise<AnalyticsResponse>
  isTracking: boolean
  error: Error | null
}

export interface UseDashboard {
  dashboard: Dashboard | null
  widgets: DashboardWidget[]
  updateWidget: (id: string, updates: Partial<DashboardWidget>) => Promise<void>
  addWidget: (widget: Partial<DashboardWidget>) => Promise<void>
  removeWidget: (id: string) => Promise<void>
  refreshData: () => Promise<void>
  isLoading: boolean
  error: Error | null
}

export interface UseRealTimeMetrics {
  metrics: RealTimeMetrics
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  subscribe: (metric: string, callback: (value: number) => void) => () => void
}