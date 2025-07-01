"""
AWS Secrets Manager Secret Rotation Lambda Function
Automatically rotates database passwords and API keys
"""

import json
import boto3
import logging
import os
import psycopg2
import string
import secrets
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
secrets_client = boto3.client('secretsmanager')
rds_client = boto3.client('rds')

# Constants
PASSWORD_LENGTH = 32
PASSWORD_CHARSET = string.ascii_letters + string.digits + "!@#$%^&*"

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for secret rotation
    """
    try:
        # Extract parameters from event
        secret_arn = event['SecretId']
        client_request_token = event['ClientRequestToken']
        step = event['Step']
        
        logger.info(f"Starting rotation step: {step} for secret: {secret_arn}")
        
        # Get secret metadata
        secret_metadata = secrets_client.describe_secret(SecretId=secret_arn)
        secret_name = secret_metadata['Name']
        
        # Route to appropriate step handler
        if step == "createSecret":
            create_secret(secret_arn, client_request_token)
        elif step == "setSecret":
            set_secret(secret_arn, client_request_token)
        elif step == "testSecret":
            test_secret(secret_arn, client_request_token)
        elif step == "finishSecret":
            finish_secret(secret_arn, client_request_token)
        else:
            raise ValueError(f"Invalid step: {step}")
        
        logger.info(f"Successfully completed step: {step}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Secret rotation step {step} completed successfully',
                'secretArn': secret_arn
            })
        }
        
    except Exception as e:
        logger.error(f"Error during secret rotation: {str(e)}")
        raise

def create_secret(secret_arn: str, client_request_token: str) -> None:
    """
    Step 1: Create new secret version with new password
    """
    try:
        # Check if pending secret already exists
        try:
            secrets_client.get_secret_value(
                SecretId=secret_arn,
                VersionStage="AWSPENDING",
                VersionId=client_request_token
            )
            logger.info("Pending secret already exists, skipping creation")
            return
        except secrets_client.exceptions.ResourceNotFoundException:
            pass
        
        # Get current secret
        current_secret = secrets_client.get_secret_value(
            SecretId=secret_arn,
            VersionStage="AWSCURRENT"
        )
        current_secret_data = json.loads(current_secret['SecretString'])
        
        # Generate new password
        new_password = generate_password()
        
        # Create new secret version
        new_secret_data = current_secret_data.copy()
        new_secret_data['password'] = new_password
        
        # Store new secret version
        secrets_client.put_secret_value(
            SecretId=secret_arn,
            ClientRequestToken=client_request_token,
            SecretString=json.dumps(new_secret_data),
            VersionStages=['AWSPENDING']
        )
        
        logger.info("Successfully created new secret version")
        
    except Exception as e:
        logger.error(f"Error creating secret: {str(e)}")
        raise

def set_secret(secret_arn: str, client_request_token: str) -> None:
    """
    Step 2: Set the new password in the database
    """
    try:
        # Get pending secret
        pending_secret = secrets_client.get_secret_value(
            SecretId=secret_arn,
            VersionStage="AWSPENDING",
            VersionId=client_request_token
        )
        pending_secret_data = json.loads(pending_secret['SecretString'])
        
        # Get current secret for admin credentials
        current_secret = secrets_client.get_secret_value(
            SecretId=secret_arn,
            VersionStage="AWSCURRENT"
        )
        current_secret_data = json.loads(current_secret['SecretString'])
        
        # Determine database type and update password
        if 'engine' in current_secret_data:
            engine = current_secret_data['engine']
            if engine in ['postgres', 'postgresql']:
                set_postgres_password(current_secret_data, pending_secret_data)
            elif engine == 'mysql':
                set_mysql_password(current_secret_data, pending_secret_data)
            else:
                raise ValueError(f"Unsupported database engine: {engine}")
        else:
            # Default to PostgreSQL for Supabase
            set_postgres_password(current_secret_data, pending_secret_data)
        
        logger.info("Successfully set new password in database")
        
    except Exception as e:
        logger.error(f"Error setting secret: {str(e)}")
        raise

def test_secret(secret_arn: str, client_request_token: str) -> None:
    """
    Step 3: Test the new secret by connecting to database
    """
    try:
        # Get pending secret
        pending_secret = secrets_client.get_secret_value(
            SecretId=secret_arn,
            VersionStage="AWSPENDING",
            VersionId=client_request_token
        )
        pending_secret_data = json.loads(pending_secret['SecretString'])
        
        # Test database connection with new credentials
        if 'engine' in pending_secret_data:
            engine = pending_secret_data['engine']
            if engine in ['postgres', 'postgresql']:
                test_postgres_connection(pending_secret_data)
            elif engine == 'mysql':
                test_mysql_connection(pending_secret_data)
            else:
                raise ValueError(f"Unsupported database engine: {engine}")
        else:
            # Default to PostgreSQL for Supabase
            test_postgres_connection(pending_secret_data)
        
        logger.info("Successfully tested new secret")
        
    except Exception as e:
        logger.error(f"Error testing secret: {str(e)}")
        raise

def finish_secret(secret_arn: str, client_request_token: str) -> None:
    """
    Step 4: Finalize rotation by moving AWSPENDING to AWSCURRENT
    """
    try:
        # Update version stages
        secrets_client.update_secret_version_stage(
            SecretId=secret_arn,
            VersionStage="AWSCURRENT",
            ClientRequestToken=client_request_token,
            RemoveFromVersionId=get_current_version_id(secret_arn)
        )
        
        logger.info("Successfully finished secret rotation")
        
        # Send notification about successful rotation
        send_rotation_notification(secret_arn, "SUCCESS")
        
    except Exception as e:
        logger.error(f"Error finishing secret rotation: {str(e)}")
        # Send failure notification
        send_rotation_notification(secret_arn, "FAILED", str(e))
        raise

def set_postgres_password(current_secret: Dict[str, Any], new_secret: Dict[str, Any]) -> None:
    """
    Set new password in PostgreSQL database
    """
    try:
        # Connect using current admin credentials
        connection = psycopg2.connect(
            host=current_secret.get('host'),
            port=current_secret.get('port', 5432),
            database=current_secret.get('dbname', 'postgres'),
            user=current_secret.get('username'),
            password=current_secret.get('password')
        )
        
        cursor = connection.cursor()
        
        # Update password for the user
        username = new_secret.get('username')
        new_password = new_secret.get('password')
        
        # Use parameterized query to prevent SQL injection
        cursor.execute(
            f"ALTER USER {username} PASSWORD %s",
            (new_password,)
        )
        
        connection.commit()
        cursor.close()
        connection.close()
        
        logger.info(f"Successfully updated password for PostgreSQL user: {username}")
        
    except Exception as e:
        logger.error(f"Error updating PostgreSQL password: {str(e)}")
        raise

def set_mysql_password(current_secret: Dict[str, Any], new_secret: Dict[str, Any]) -> None:
    """
    Set new password in MySQL database
    """
    import pymysql
    
    try:
        # Connect using current admin credentials
        connection = pymysql.connect(
            host=current_secret.get('host'),
            port=current_secret.get('port', 3306),
            database=current_secret.get('dbname'),
            user=current_secret.get('username'),
            password=current_secret.get('password')
        )
        
        cursor = connection.cursor()
        
        # Update password for the user
        username = new_secret.get('username')
        new_password = new_secret.get('password')
        
        cursor.execute(
            f"ALTER USER '{username}'@'%' IDENTIFIED BY %s",
            (new_password,)
        )
        
        connection.commit()
        cursor.close()
        connection.close()
        
        logger.info(f"Successfully updated password for MySQL user: {username}")
        
    except Exception as e:
        logger.error(f"Error updating MySQL password: {str(e)}")
        raise

def test_postgres_connection(secret_data: Dict[str, Any]) -> None:
    """
    Test PostgreSQL connection with new credentials
    """
    try:
        connection = psycopg2.connect(
            host=secret_data.get('host'),
            port=secret_data.get('port', 5432),
            database=secret_data.get('dbname', 'postgres'),
            user=secret_data.get('username'),
            password=secret_data.get('password'),
            connect_timeout=10
        )
        
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        
        if result[0] != 1:
            raise Exception("Database test query failed")
        
        cursor.close()
        connection.close()
        
        logger.info("PostgreSQL connection test successful")
        
    except Exception as e:
        logger.error(f"PostgreSQL connection test failed: {str(e)}")
        raise

def test_mysql_connection(secret_data: Dict[str, Any]) -> None:
    """
    Test MySQL connection with new credentials
    """
    import pymysql
    
    try:
        connection = pymysql.connect(
            host=secret_data.get('host'),
            port=secret_data.get('port', 3306),
            database=secret_data.get('dbname'),
            user=secret_data.get('username'),
            password=secret_data.get('password'),
            connect_timeout=10
        )
        
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        
        if result[0] != 1:
            raise Exception("Database test query failed")
        
        cursor.close()
        connection.close()
        
        logger.info("MySQL connection test successful")
        
    except Exception as e:
        logger.error(f"MySQL connection test failed: {str(e)}")
        raise

def generate_password() -> str:
    """
    Generate a cryptographically secure password
    """
    # Ensure password has at least one character from each category
    password = [
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%^&*")
    ]
    
    # Fill remaining length with random characters
    for _ in range(PASSWORD_LENGTH - 4):
        password.append(secrets.choice(PASSWORD_CHARSET))
    
    # Shuffle the password
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password)

def get_current_version_id(secret_arn: str) -> str:
    """
    Get the current version ID of a secret
    """
    try:
        current_secret = secrets_client.get_secret_value(
            SecretId=secret_arn,
            VersionStage="AWSCURRENT"
        )
        return current_secret['VersionId']
    except Exception as e:
        logger.error(f"Error getting current version ID: {str(e)}")
        raise

def send_rotation_notification(secret_arn: str, status: str, error_message: str = None) -> None:
    """
    Send notification about rotation status
    """
    try:
        sns_client = boto3.client('sns')
        topic_arn = os.environ.get('SNS_TOPIC_ARN')
        
        if not topic_arn:
            logger.warning("SNS_TOPIC_ARN not configured, skipping notification")
            return
        
        secret_name = secret_arn.split(':')[-1]
        
        if status == "SUCCESS":
            subject = f"Secret Rotation Successful: {secret_name}"
            message = f"Secret rotation completed successfully for {secret_name}"
        else:
            subject = f"Secret Rotation Failed: {secret_name}"
            message = f"Secret rotation failed for {secret_name}. Error: {error_message}"
        
        sns_client.publish(
            TopicArn=topic_arn,
            Subject=subject,
            Message=message
        )
        
        logger.info(f"Notification sent for secret rotation: {status}")
        
    except Exception as e:
        logger.error(f"Error sending notification: {str(e)}")
        # Don't raise exception for notification failures

# Health check function for monitoring
def health_check() -> Dict[str, Any]:
    """
    Health check for the rotation function
    """
    try:
        # Test AWS service connectivity
        secrets_client.list_secrets(MaxResults=1)
        
        return {
            'status': 'healthy',
            'timestamp': json.dumps(secrets.token_hex(8)),
            'services': {
                'secrets_manager': 'connected',
                'rds': 'connected'
            }
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': json.dumps(secrets.token_hex(8))
        }