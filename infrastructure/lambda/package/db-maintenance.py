"""
Database Maintenance Lambda Function
Automated database optimization and maintenance tasks
"""

import json
import boto3
import logging
import os
import psycopg2
from datetime import datetime, timedelta
from typing import Dict, Any, List

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
rds_client = boto3.client('rds')
cloudwatch_client = boto3.client('cloudwatch')
sns_client = boto3.client('sns')
secrets_client = boto3.client('secretsmanager')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for database maintenance
    """
    try:
        db_instance_id = os.environ['DB_INSTANCE_ID']
        sns_topic_arn = os.environ['SNS_TOPIC_ARN']
        
        logger.info(f"Starting database maintenance for instance: {db_instance_id}")
        
        # Get database connection details
        db_connection = get_database_connection(db_instance_id)
        
        # Perform maintenance tasks
        maintenance_results = []
        
        # 1. Analyze database performance
        performance_analysis = analyze_database_performance(db_connection)
        maintenance_results.append(performance_analysis)
        
        # 2. Optimize database statistics
        statistics_optimization = optimize_database_statistics(db_connection)
        maintenance_results.append(statistics_optimization)
        
        # 3. Clean up old data
        data_cleanup = cleanup_old_data(db_connection)
        maintenance_results.append(data_cleanup)
        
        # 4. Analyze disk usage
        disk_analysis = analyze_disk_usage(db_connection)
        maintenance_results.append(disk_analysis)
        
        # 5. Check for blocking queries
        blocking_queries = check_blocking_queries(db_connection)
        maintenance_results.append(blocking_queries)
        
        # 6. Update CloudWatch metrics
        update_custom_metrics(db_instance_id, maintenance_results)
        
        # 7. Generate maintenance report
        report = generate_maintenance_report(maintenance_results)
        
        # Send notification if critical issues found
        critical_issues = [r for r in maintenance_results if r.get('severity') == 'critical']
        if critical_issues:
            send_alert_notification(sns_topic_arn, report, critical_issues)
        
        logger.info("Database maintenance completed successfully")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Database maintenance completed',
                'results': maintenance_results,
                'report': report
            })
        }
        
    except Exception as e:
        logger.error(f"Database maintenance failed: {str(e)}")
        
        # Send failure notification
        try:
            send_failure_notification(os.environ.get('SNS_TOPIC_ARN'), str(e))
        except:
            pass
        
        raise

def get_database_connection(db_instance_id: str) -> Dict[str, Any]:
    """
    Get database connection details from RDS and Secrets Manager
    """
    try:
        # Get RDS instance details
        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_instance_id)
        db_instance = response['DBInstances'][0]
        
        # Get connection details from secrets manager
        secret_arn = None
        for tag in db_instance.get('TagList', []):
            if tag['Key'] == 'SecretArn':
                secret_arn = tag['Value']
                break
        
        if not secret_arn:
            # Try to find secret by naming convention
            secret_name = f"{db_instance_id}-credentials"
            try:
                secret_response = secrets_client.describe_secret(SecretId=secret_name)
                secret_arn = secret_response['ARN']
            except:
                raise Exception(f"Could not find database credentials secret for {db_instance_id}")
        
        # Get secret value
        secret_value = secrets_client.get_secret_value(SecretId=secret_arn)
        credentials = json.loads(secret_value['SecretString'])
        
        return {
            'host': db_instance['Endpoint']['Address'],
            'port': db_instance['Endpoint']['Port'],
            'database': db_instance['DBName'],
            'username': credentials['username'],
            'password': credentials['password'],
            'engine': db_instance['Engine']
        }
        
    except Exception as e:
        logger.error(f"Failed to get database connection details: {str(e)}")
        raise

def analyze_database_performance(db_connection: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze database performance metrics and identify issues
    """
    try:
        conn = psycopg2.connect(
            host=db_connection['host'],
            port=db_connection['port'],
            database=db_connection['database'],
            user=db_connection['username'],
            password=db_connection['password']
        )
        
        cursor = conn.cursor()
        
        # Get slow queries from pg_stat_statements
        cursor.execute("""
            SELECT 
                query,
                calls,
                total_exec_time,
                mean_exec_time,
                rows,
                100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
            FROM pg_stat_statements 
            WHERE mean_exec_time > 1000  -- queries slower than 1 second
            ORDER BY total_exec_time DESC 
            LIMIT 10;
        """)
        
        slow_queries = cursor.fetchall()
        
        # Get database size and growth
        cursor.execute("""
            SELECT 
                pg_database.datname,
                pg_size_pretty(pg_database_size(pg_database.datname)) as size,
                pg_database_size(pg_database.datname) as size_bytes
            FROM pg_database 
            WHERE datname = current_database();
        """)
        
        db_size = cursor.fetchone()
        
        # Get table sizes
        cursor.execute("""
            SELECT 
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
            FROM pg_tables 
            WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
            LIMIT 10;
        """)
        
        large_tables = cursor.fetchall()
        
        # Get connection count
        cursor.execute("""
            SELECT 
                count(*) as total_connections,
                count(*) FILTER (WHERE state = 'active') as active_connections,
                count(*) FILTER (WHERE state = 'idle') as idle_connections
            FROM pg_stat_activity 
            WHERE datname = current_database();
        """)
        
        connection_stats = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # Analyze results
        issues = []
        severity = 'info'
        
        if slow_queries:
            issues.append(f"Found {len(slow_queries)} slow queries (>1s)")
            severity = 'warning'
        
        if connection_stats[1] > 50:  # More than 50 active connections
            issues.append(f"High active connection count: {connection_stats[1]}")
            severity = 'warning'
        
        if db_size[2] > 100 * 1024 * 1024 * 1024:  # Database larger than 100GB
            issues.append(f"Large database size: {db_size[1]}")
            severity = 'warning'
        
        return {
            'task': 'performance_analysis',
            'status': 'completed',
            'severity': severity,
            'issues': issues,
            'metrics': {
                'slow_queries_count': len(slow_queries),
                'database_size_bytes': db_size[2],
                'total_connections': connection_stats[0],
                'active_connections': connection_stats[1],
                'idle_connections': connection_stats[2]
            },
            'details': {
                'slow_queries': slow_queries[:5],  # Top 5 slow queries
                'large_tables': large_tables[:5],  # Top 5 large tables
                'database_size': db_size[1]
            }
        }
        
    except Exception as e:
        logger.error(f"Performance analysis failed: {str(e)}")
        return {
            'task': 'performance_analysis',
            'status': 'failed',
            'severity': 'critical',
            'error': str(e)
        }

def optimize_database_statistics(db_connection: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update database statistics for better query planning
    """
    try:
        conn = psycopg2.connect(
            host=db_connection['host'],
            port=db_connection['port'],
            database=db_connection['database'],
            user=db_connection['username'],
            password=db_connection['password']
        )
        
        cursor = conn.cursor()
        
        # Get tables that need statistics update
        cursor.execute("""
            SELECT 
                schemaname,
                tablename,
                last_analyze,
                n_tup_ins + n_tup_upd + n_tup_del as total_changes
            FROM pg_stat_user_tables 
            WHERE 
                last_analyze < NOW() - INTERVAL '7 days' 
                OR (n_tup_ins + n_tup_upd + n_tup_del) > 1000
            ORDER BY total_changes DESC;
        """)
        
        tables_to_analyze = cursor.fetchall()
        
        analyzed_tables = []
        
        # Analyze tables that need it
        for table in tables_to_analyze:
            schema_name, table_name = table[0], table[1]
            try:
                cursor.execute(f'ANALYZE "{schema_name}"."{table_name}";')
                analyzed_tables.append(f"{schema_name}.{table_name}")
                logger.info(f"Analyzed table: {schema_name}.{table_name}")
            except Exception as e:
                logger.warning(f"Failed to analyze {schema_name}.{table_name}: {str(e)}")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'task': 'statistics_optimization',
            'status': 'completed',
            'severity': 'info',
            'message': f"Analyzed {len(analyzed_tables)} tables",
            'details': {
                'analyzed_tables': analyzed_tables,
                'total_tables_needing_analysis': len(tables_to_analyze)
            }
        }
        
    except Exception as e:
        logger.error(f"Statistics optimization failed: {str(e)}")
        return {
            'task': 'statistics_optimization',
            'status': 'failed',
            'severity': 'critical',
            'error': str(e)
        }

def cleanup_old_data(db_connection: Dict[str, Any]) -> Dict[str, Any]:
    """
    Clean up old data based on retention policies
    """
    try:
        conn = psycopg2.connect(
            host=db_connection['host'],
            port=db_connection['port'],
            database=db_connection['database'],
            user=db_connection['username'],
            password=db_connection['password']
        )
        
        cursor = conn.cursor()
        
        cleanup_results = []
        
        # Clean up old audit logs (older than 90 days)
        cursor.execute("""
            DELETE FROM security_audit_logs 
            WHERE created_at < NOW() - INTERVAL '90 days';
        """)
        
        audit_logs_deleted = cursor.rowcount
        cleanup_results.append(f"Deleted {audit_logs_deleted} old audit log entries")
        
        # Clean up old translation cache entries (older than 30 days)
        cursor.execute("""
            DELETE FROM translation_cache 
            WHERE created_at < NOW() - INTERVAL '30 days' 
            AND last_accessed < NOW() - INTERVAL '7 days';
        """)
        
        cache_entries_deleted = cursor.rowcount
        cleanup_results.append(f"Deleted {cache_entries_deleted} old cache entries")
        
        # Clean up old job queue entries (completed jobs older than 7 days)
        cursor.execute("""
            DELETE FROM pgboss.job 
            WHERE state = 'completed' 
            AND completedon < NOW() - INTERVAL '7 days';
        """)
        
        jobs_deleted = cursor.rowcount
        cleanup_results.append(f"Deleted {jobs_deleted} old completed jobs")
        
        # Clean up old session data (older than 24 hours)
        cursor.execute("""
            DELETE FROM user_sessions 
            WHERE expires_at < NOW();
        """)
        
        sessions_deleted = cursor.rowcount
        cleanup_results.append(f"Deleted {sessions_deleted} expired sessions")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        total_deleted = audit_logs_deleted + cache_entries_deleted + jobs_deleted + sessions_deleted
        
        severity = 'info'
        if total_deleted > 10000:
            severity = 'warning'  # Large cleanup might indicate data retention issue
        
        return {
            'task': 'data_cleanup',
            'status': 'completed',
            'severity': severity,
            'message': f"Cleaned up {total_deleted} old records",
            'details': {
                'audit_logs_deleted': audit_logs_deleted,
                'cache_entries_deleted': cache_entries_deleted,
                'jobs_deleted': jobs_deleted,
                'sessions_deleted': sessions_deleted,
                'total_deleted': total_deleted
            }
        }
        
    except Exception as e:
        logger.error(f"Data cleanup failed: {str(e)}")
        return {
            'task': 'data_cleanup',
            'status': 'failed',
            'severity': 'critical',
            'error': str(e)
        }

def analyze_disk_usage(db_connection: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze disk usage and identify space issues
    """
    try:
        conn = psycopg2.connect(
            host=db_connection['host'],
            port=db_connection['port'],
            database=db_connection['database'],
            user=db_connection['username'],
            password=db_connection['password']
        )
        
        cursor = conn.cursor()
        
        # Get database disk usage
        cursor.execute("""
            SELECT 
                pg_size_pretty(pg_database_size(current_database())) as total_size,
                pg_database_size(current_database()) as total_size_bytes;
        """)
        
        db_size = cursor.fetchone()
        
        # Get table and index sizes
        cursor.execute("""
            SELECT 
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
                pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
                pg_total_relation_size(schemaname||'.'||tablename) as total_size_bytes
            FROM pg_tables 
            WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
            LIMIT 20;
        """)
        
        table_sizes = cursor.fetchall()
        
        # Get unused indexes
        cursor.execute("""
            SELECT 
                schemaname,
                tablename,
                indexname,
                idx_scan,
                pg_size_pretty(pg_relation_size(indexrelid)) as size
            FROM pg_stat_user_indexes 
            WHERE idx_scan < 10  -- Indexes used less than 10 times
            AND pg_relation_size(indexrelid) > 1024*1024  -- Larger than 1MB
            ORDER BY pg_relation_size(indexrelid) DESC;
        """)
        
        unused_indexes = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Analyze results
        issues = []
        severity = 'info'
        
        # Check for large database
        if db_size[1] > 500 * 1024 * 1024 * 1024:  # > 500GB
            issues.append(f"Very large database: {db_size[0]}")
            severity = 'warning'
        
        # Check for unused indexes
        if len(unused_indexes) > 5:
            issues.append(f"Found {len(unused_indexes)} potentially unused indexes")
            if severity == 'info':
                severity = 'warning'
        
        # Check for very large tables
        large_tables = [t for t in table_sizes if t[5] > 50 * 1024 * 1024 * 1024]  # > 50GB
        if large_tables:
            issues.append(f"Found {len(large_tables)} very large tables (>50GB)")
            if severity == 'info':
                severity = 'warning'
        
        return {
            'task': 'disk_usage_analysis',
            'status': 'completed',
            'severity': severity,
            'issues': issues,
            'metrics': {
                'total_database_size_bytes': db_size[1],
                'large_tables_count': len(large_tables),
                'unused_indexes_count': len(unused_indexes)
            },
            'details': {
                'database_size': db_size[0],
                'top_tables': table_sizes[:10],
                'unused_indexes': unused_indexes[:10]
            }
        }
        
    except Exception as e:
        logger.error(f"Disk usage analysis failed: {str(e)}")
        return {
            'task': 'disk_usage_analysis',
            'status': 'failed',
            'severity': 'critical',
            'error': str(e)
        }

def check_blocking_queries(db_connection: Dict[str, Any]) -> Dict[str, Any]:
    """
    Check for blocking queries and deadlocks
    """
    try:
        conn = psycopg2.connect(
            host=db_connection['host'],
            port=db_connection['port'],
            database=db_connection['database'],
            user=db_connection['username'],
            password=db_connection['password']
        )
        
        cursor = conn.cursor()
        
        # Check for blocking queries
        cursor.execute("""
            SELECT 
                blocked_locks.pid AS blocked_pid,
                blocked_activity.usename AS blocked_user,
                blocking_locks.pid AS blocking_pid,
                blocking_activity.usename AS blocking_user,
                blocked_activity.query AS blocked_statement,
                blocking_activity.query AS blocking_statement,
                NOW() - blocked_activity.query_start AS blocked_duration
            FROM pg_catalog.pg_locks blocked_locks
            JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
            JOIN pg_catalog.pg_locks blocking_locks 
                ON blocking_locks.locktype = blocked_locks.locktype
                AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
                AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
                AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
                AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
                AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
                AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
                AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
                AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
                AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
                AND blocking_locks.pid != blocked_locks.pid
            JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
            WHERE NOT blocked_locks.granted;
        """)
        
        blocking_queries = cursor.fetchall()
        
        # Check for long-running queries
        cursor.execute("""
            SELECT 
                pid,
                usename,
                state,
                query_start,
                NOW() - query_start AS duration,
                query
            FROM pg_stat_activity 
            WHERE 
                state = 'active' 
                AND NOW() - query_start > INTERVAL '5 minutes'
                AND query NOT LIKE '%pg_stat_activity%'
            ORDER BY query_start;
        """)
        
        long_queries = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Analyze results
        issues = []
        severity = 'info'
        
        if blocking_queries:
            issues.append(f"Found {len(blocking_queries)} blocking queries")
            severity = 'critical'
        
        if long_queries:
            issues.append(f"Found {len(long_queries)} long-running queries (>5 minutes)")
            if severity == 'info':
                severity = 'warning'
        
        return {
            'task': 'blocking_queries_check',
            'status': 'completed',
            'severity': severity,
            'issues': issues,
            'metrics': {
                'blocking_queries_count': len(blocking_queries),
                'long_running_queries_count': len(long_queries)
            },
            'details': {
                'blocking_queries': blocking_queries,
                'long_running_queries': long_queries[:5]  # Top 5 longest
            }
        }
        
    except Exception as e:
        logger.error(f"Blocking queries check failed: {str(e)}")
        return {
            'task': 'blocking_queries_check',
            'status': 'failed',
            'severity': 'critical',
            'error': str(e)
        }

def update_custom_metrics(db_instance_id: str, maintenance_results: List[Dict[str, Any]]) -> None:
    """
    Update custom CloudWatch metrics based on maintenance results
    """
    try:
        metrics = []
        
        for result in maintenance_results:
            if result['status'] == 'completed' and 'metrics' in result:
                for metric_name, metric_value in result['metrics'].items():
                    metrics.append({
                        'MetricName': f"DB_{metric_name}",
                        'Value': metric_value,
                        'Unit': 'Count',
                        'Dimensions': [
                            {
                                'Name': 'DBInstanceIdentifier',
                                'Value': db_instance_id
                            }
                        ]
                    })
        
        # Send metrics to CloudWatch
        if metrics:
            cloudwatch_client.put_metric_data(
                Namespace='Prismy/Database',
                MetricData=metrics
            )
            
            logger.info(f"Sent {len(metrics)} custom metrics to CloudWatch")
        
    except Exception as e:
        logger.error(f"Failed to update custom metrics: {str(e)}")

def generate_maintenance_report(maintenance_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate a comprehensive maintenance report
    """
    total_tasks = len(maintenance_results)
    completed_tasks = len([r for r in maintenance_results if r['status'] == 'completed'])
    failed_tasks = len([r for r in maintenance_results if r['status'] == 'failed'])
    
    critical_issues = [r for r in maintenance_results if r.get('severity') == 'critical']
    warning_issues = [r for r in maintenance_results if r.get('severity') == 'warning']
    
    overall_status = 'healthy'
    if critical_issues:
        overall_status = 'critical'
    elif warning_issues:
        overall_status = 'warning'
    
    return {
        'timestamp': datetime.utcnow().isoformat(),
        'overall_status': overall_status,
        'summary': {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'failed_tasks': failed_tasks,
            'critical_issues': len(critical_issues),
            'warning_issues': len(warning_issues)
        },
        'tasks': maintenance_results
    }

def send_alert_notification(sns_topic_arn: str, report: Dict[str, Any], critical_issues: List[Dict[str, Any]]) -> None:
    """
    Send alert notification for critical issues
    """
    try:
        subject = f"Database Maintenance Alert - {report['overall_status'].upper()}"
        
        message = f"""
Database Maintenance Alert

Overall Status: {report['overall_status'].upper()}
Timestamp: {report['timestamp']}

Summary:
- Total Tasks: {report['summary']['total_tasks']}
- Completed: {report['summary']['completed_tasks']}
- Failed: {report['summary']['failed_tasks']}
- Critical Issues: {report['summary']['critical_issues']}
- Warning Issues: {report['summary']['warning_issues']}

Critical Issues:
"""
        
        for issue in critical_issues:
            message += f"\n- {issue['task']}: {issue.get('error', 'Unknown error')}"
            if 'issues' in issue:
                for detail in issue['issues']:
                    message += f"\n  * {detail}"
        
        message += f"\n\nFull report available in CloudWatch Logs."
        
        sns_client.publish(
            TopicArn=sns_topic_arn,
            Subject=subject,
            Message=message
        )
        
        logger.info("Alert notification sent successfully")
        
    except Exception as e:
        logger.error(f"Failed to send alert notification: {str(e)}")

def send_failure_notification(sns_topic_arn: str, error_message: str) -> None:
    """
    Send notification for maintenance failure
    """
    try:
        if not sns_topic_arn:
            return
            
        subject = "Database Maintenance Failed"
        message = f"""
Database maintenance failed with error:

{error_message}

Please check CloudWatch Logs for detailed error information.
"""
        
        sns_client.publish(
            TopicArn=sns_topic_arn,
            Subject=subject,
            Message=message
        )
        
    except Exception as e:
        logger.error(f"Failed to send failure notification: {str(e)}")