/**
 * TanStack Query Performance Monitoring Hook
 * Provides performance metrics and analytics for query optimization
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface PerformanceMetrics {
  cacheHitRatio: number;
  averageQueryTime: number;
  totalQueries: number;
  failedQueries: number;
  backgroundRefetches: number;
}

interface QueryPerformanceData {
  queryKey: string;
  duration: number;
  timestamp: number;
  status: 'success' | 'error' | 'loading';
  cacheHit: boolean;
}

class QueryPerformanceMonitor {
  private static instance: QueryPerformanceMonitor;
  private metrics: Map<string, QueryPerformanceData[]> = new Map();
  private cacheStats = {
    hits: 0,
    misses: 0,
    total: 0,
  };

  static getInstance(): QueryPerformanceMonitor {
    if (!QueryPerformanceMonitor.instance) {
      QueryPerformanceMonitor.instance = new QueryPerformanceMonitor();
    }
    return QueryPerformanceMonitor.instance;
  }

  recordQuery(data: QueryPerformanceData) {
    const key = data.queryKey;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const queries = this.metrics.get(key)!;
    queries.push(data);
    
    // Keep only last 100 entries per query
    if (queries.length > 100) {
      queries.shift();
    }

    // Update cache stats
    if (data.cacheHit) {
      this.cacheStats.hits++;
    } else {
      this.cacheStats.misses++;
    }
    this.cacheStats.total++;
  }

  getMetrics(): PerformanceMetrics {
    let totalDuration = 0;
    let totalQueries = 0;
    let failedQueries = 0;
    let backgroundRefetches = 0;

    for (const queries of this.metrics.values()) {
      for (const query of queries) {
        totalDuration += query.duration;
        totalQueries++;
        if (query.status === 'error') {
          failedQueries++;
        }
        if (query.cacheHit) {
          backgroundRefetches++;
        }
      }
    }

    return {
      cacheHitRatio: this.cacheStats.total > 0 
        ? this.cacheStats.hits / this.cacheStats.total 
        : 0,
      averageQueryTime: totalQueries > 0 ? totalDuration / totalQueries : 0,
      totalQueries,
      failedQueries,
      backgroundRefetches,
    };
  }

  getQueryMetrics(queryKey: string) {
    const queries = this.metrics.get(queryKey) || [];
    const recent = queries.slice(-10); // Last 10 queries
    
    if (recent.length === 0) {
      return {
        averageTime: 0,
        successRate: 0,
        cacheHitRate: 0,
        totalRequests: 0,
      };
    }

    const totalTime = recent.reduce((sum, q) => sum + q.duration, 0);
    const successCount = recent.filter(q => q.status === 'success').length;
    const cacheHits = recent.filter(q => q.cacheHit).length;

    return {
      averageTime: totalTime / recent.length,
      successRate: successCount / recent.length,
      cacheHitRate: cacheHits / recent.length,
      totalRequests: recent.length,
    };
  }

  reset() {
    this.metrics.clear();
    this.cacheStats = { hits: 0, misses: 0, total: 0 };
  }
}

/**
 * Hook to monitor TanStack Query performance
 */
export function useQueryPerformanceMonitor() {
  const queryClient = useQueryClient();
  const monitor = useRef(QueryPerformanceMonitor.getInstance());
  const startTimes = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Monitor query start
    const unsubscribeStart = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'added') {
        startTimes.current.set(
          JSON.stringify(event.mutation.options.mutationKey),
          Date.now()
        );
      }
    });

    // Monitor query completion
    const unsubscribeEnd = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.state.status !== 'loading') {
        const queryKey = JSON.stringify(event.query.queryKey);
        const startTime = startTimes.current.get(queryKey);
        
        if (startTime) {
          const duration = Date.now() - startTime;
          const cacheHit = event.query.state.dataUpdateCount > 0;
          
          monitor.current.recordQuery({
            queryKey,
            duration,
            timestamp: Date.now(),
            status: event.query.state.status === 'error' ? 'error' : 'success',
            cacheHit,
          });

          startTimes.current.delete(queryKey);
        }
      }
    });

    return () => {
      unsubscribeStart();
      unsubscribeEnd();
    };
  }, [queryClient]);

  return {
    getMetrics: () => monitor.current.getMetrics(),
    getQueryMetrics: (queryKey: string) => monitor.current.getQueryMetrics(queryKey),
    reset: () => monitor.current.reset(),
  };
}

/**
 * Hook for development performance logging
 */
export function useQueryPerformanceLogger(enabled = process.env.NODE_ENV === 'development') {
  const { getMetrics, getQueryMetrics } = useQueryPerformanceMonitor();
  const logIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) return;

    // Log performance metrics every 30 seconds in development
    logIntervalRef.current = setInterval(() => {
      const metrics = getMetrics();
      
      if (metrics.totalQueries > 0) {
        console.group('🚀 TanStack Query Performance');
        console.log('Cache Hit Ratio:', `${(metrics.cacheHitRatio * 100).toFixed(1)}%`);
        console.log('Average Query Time:', `${metrics.averageQueryTime.toFixed(0)}ms`);
        console.log('Total Queries:', metrics.totalQueries);
        console.log('Failed Queries:', metrics.failedQueries);
        console.log('Background Refetches:', metrics.backgroundRefetches);
        
        // Log specific query metrics for organizations
        const orgMetrics = getQueryMetrics('organizations');
        if (orgMetrics.totalRequests > 0) {
          console.log('\nOrganizations Query:');
          console.log('  Average Time:', `${orgMetrics.averageTime.toFixed(0)}ms`);
          console.log('  Success Rate:', `${(orgMetrics.successRate * 100).toFixed(1)}%`);
          console.log('  Cache Hit Rate:', `${(orgMetrics.cacheHitRate * 100).toFixed(1)}%`);
        }
        
        console.groupEnd();
      }
    }, 30000);

    return () => {
      if (logIntervalRef.current) {
        clearInterval(logIntervalRef.current);
      }
    };
  }, [enabled, getMetrics, getQueryMetrics]);
}

/**
 * Custom hook to track individual query performance
 */
export function useQueryTiming(queryKey: unknown[]) {
  const startTimeRef = useRef<number>();
  const monitor = QueryPerformanceMonitor.getInstance();

  const startTiming = () => {
    startTimeRef.current = Date.now();
  };

  const endTiming = (status: 'success' | 'error' = 'success', cacheHit = false) => {
    if (startTimeRef.current) {
      const duration = Date.now() - startTimeRef.current;
      monitor.recordQuery({
        queryKey: JSON.stringify(queryKey),
        duration,
        timestamp: Date.now(),
        status,
        cacheHit,
      });
    }
  };

  return { startTiming, endTiming };
}

export type { PerformanceMetrics, QueryPerformanceData };