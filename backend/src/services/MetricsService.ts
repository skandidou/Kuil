/**
 * MetricsService - Application metrics collection and reporting
 *
 * Collects and exposes metrics for monitoring:
 * - Request counts and latencies
 * - Error rates
 * - Business metrics (posts generated, published, etc.)
 * - Resource usage
 */

import { Logger } from './LoggerService';

interface RequestMetric {
  count: number;
  totalLatency: number;
  errors: number;
  lastMinuteRequests: number[];
}

interface BusinessMetric {
  count: number;
  lastOccurrence?: Date;
}

class MetricsServiceClass {
  private requestMetrics: Map<string, RequestMetric> = new Map();
  private businessMetrics: Map<string, BusinessMetric> = new Map();
  private startTime: Date = new Date();
  private errorCount: number = 0;
  private totalRequests: number = 0;

  // Rate tracking (requests per minute)
  private requestTimestamps: number[] = [];
  private readonly RATE_WINDOW_MS = 60000; // 1 minute

  /**
   * Record an HTTP request
   */
  recordRequest(method: string, path: string, statusCode: number, latencyMs: number): void {
    const key = `${method} ${this.normalizePath(path)}`;
    const now = Date.now();

    // Update request metrics
    let metric = this.requestMetrics.get(key);
    if (!metric) {
      metric = { count: 0, totalLatency: 0, errors: 0, lastMinuteRequests: [] };
      this.requestMetrics.set(key, metric);
    }

    metric.count++;
    metric.totalLatency += latencyMs;
    if (statusCode >= 400) {
      metric.errors++;
      this.errorCount++;
    }

    // Track last minute requests for rate calculation
    metric.lastMinuteRequests.push(now);
    metric.lastMinuteRequests = metric.lastMinuteRequests.filter(
      (ts) => now - ts < this.RATE_WINDOW_MS
    );

    // Global tracking
    this.totalRequests++;
    this.requestTimestamps.push(now);
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => now - ts < this.RATE_WINDOW_MS
    );
  }

  /**
   * Record a business event
   */
  recordEvent(eventName: string, count: number = 1): void {
    let metric = this.businessMetrics.get(eventName);
    if (!metric) {
      metric = { count: 0 };
      this.businessMetrics.set(eventName, metric);
    }

    metric.count += count;
    metric.lastOccurrence = new Date();
  }

  /**
   * Common business events helpers
   */
  recordPostGenerated(): void {
    this.recordEvent('posts_generated');
  }

  recordPostPublished(): void {
    this.recordEvent('posts_published');
  }

  recordPostScheduled(): void {
    this.recordEvent('posts_scheduled');
  }

  recordVoiceAnalysis(): void {
    this.recordEvent('voice_analyses');
  }

  recordUserLogin(): void {
    this.recordEvent('user_logins');
  }

  recordUserSignup(): void {
    this.recordEvent('user_signups');
  }

  recordAIRequest(): void {
    this.recordEvent('ai_requests');
  }

  recordLinkedInAPICall(): void {
    this.recordEvent('linkedin_api_calls');
  }

  /**
   * Normalize path to group similar routes
   * e.g., /api/posts/123 -> /api/posts/:id
   */
  private normalizePath(path: string): string {
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid')
      .replace(/\/\d+/g, '/:id');
  }

  /**
   * Get current requests per minute
   */
  getRequestsPerMinute(): number {
    const now = Date.now();
    const recentRequests = this.requestTimestamps.filter(
      (ts) => now - ts < this.RATE_WINDOW_MS
    );
    return recentRequests.length;
  }

  /**
   * Get error rate (percentage)
   */
  getErrorRate(): number {
    if (this.totalRequests === 0) return 0;
    return (this.errorCount / this.totalRequests) * 100;
  }

  /**
   * Get uptime in seconds
   */
  getUptimeSeconds(): number {
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }

  /**
   * Get all metrics for monitoring endpoint
   */
  getMetrics(): object {
    const requestMetricsArray: object[] = [];
    this.requestMetrics.forEach((metric, key) => {
      requestMetricsArray.push({
        endpoint: key,
        totalRequests: metric.count,
        avgLatencyMs: metric.count > 0 ? Math.round(metric.totalLatency / metric.count) : 0,
        errorCount: metric.errors,
        requestsPerMinute: metric.lastMinuteRequests.length,
      });
    });

    const businessMetricsObj: Record<string, { count: number; lastOccurrence?: string }> = {};
    this.businessMetrics.forEach((metric, key) => {
      businessMetricsObj[key] = {
        count: metric.count,
        lastOccurrence: metric.lastOccurrence?.toISOString(),
      };
    });

    return {
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: this.getUptimeSeconds(),
        startedAt: this.startTime.toISOString(),
      },
      requests: {
        total: this.totalRequests,
        perMinute: this.getRequestsPerMinute(),
        errorRate: `${this.getErrorRate().toFixed(2)}%`,
        totalErrors: this.errorCount,
      },
      endpoints: requestMetricsArray.sort((a: any, b: any) => b.totalRequests - a.totalRequests),
      business: businessMetricsObj,
      memory: {
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    };
  }

  /**
   * Get Prometheus-compatible metrics format
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];
    const prefix = 'kuil';

    // Uptime
    lines.push(`# HELP ${prefix}_uptime_seconds Total uptime in seconds`);
    lines.push(`# TYPE ${prefix}_uptime_seconds counter`);
    lines.push(`${prefix}_uptime_seconds ${this.getUptimeSeconds()}`);

    // Total requests
    lines.push(`# HELP ${prefix}_http_requests_total Total HTTP requests`);
    lines.push(`# TYPE ${prefix}_http_requests_total counter`);
    lines.push(`${prefix}_http_requests_total ${this.totalRequests}`);

    // Error count
    lines.push(`# HELP ${prefix}_http_errors_total Total HTTP errors`);
    lines.push(`# TYPE ${prefix}_http_errors_total counter`);
    lines.push(`${prefix}_http_errors_total ${this.errorCount}`);

    // Requests per minute
    lines.push(`# HELP ${prefix}_http_requests_per_minute Current requests per minute`);
    lines.push(`# TYPE ${prefix}_http_requests_per_minute gauge`);
    lines.push(`${prefix}_http_requests_per_minute ${this.getRequestsPerMinute()}`);

    // Per-endpoint metrics
    lines.push(`# HELP ${prefix}_endpoint_requests_total Requests per endpoint`);
    lines.push(`# TYPE ${prefix}_endpoint_requests_total counter`);
    this.requestMetrics.forEach((metric, key) => {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      lines.push(`${prefix}_endpoint_requests_total{endpoint="${key}"} ${metric.count}`);
    });

    // Business metrics
    lines.push(`# HELP ${prefix}_business_events_total Business events count`);
    lines.push(`# TYPE ${prefix}_business_events_total counter`);
    this.businessMetrics.forEach((metric, key) => {
      lines.push(`${prefix}_business_events_total{event="${key}"} ${metric.count}`);
    });

    // Memory metrics
    const mem = process.memoryUsage();
    lines.push(`# HELP ${prefix}_memory_heap_used_bytes Heap memory used`);
    lines.push(`# TYPE ${prefix}_memory_heap_used_bytes gauge`);
    lines.push(`${prefix}_memory_heap_used_bytes ${mem.heapUsed}`);

    lines.push(`# HELP ${prefix}_memory_heap_total_bytes Total heap memory`);
    lines.push(`# TYPE ${prefix}_memory_heap_total_bytes gauge`);
    lines.push(`${prefix}_memory_heap_total_bytes ${mem.heapTotal}`);

    return lines.join('\n');
  }

  /**
   * Log periodic summary (call from interval)
   */
  logSummary(): void {
    Logger.info('METRICS', 'Periodic metrics summary', {
      uptime: this.getUptimeSeconds(),
      totalRequests: this.totalRequests,
      requestsPerMinute: this.getRequestsPerMinute(),
      errorRate: `${this.getErrorRate().toFixed(2)}%`,
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    });
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset(): void {
    this.requestMetrics.clear();
    this.businessMetrics.clear();
    this.requestTimestamps = [];
    this.errorCount = 0;
    this.totalRequests = 0;
    this.startTime = new Date();
  }
}

// Singleton instance
export const MetricsService = new MetricsServiceClass();
