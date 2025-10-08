"""
Storage Service for uploading bill images to AWS S3
"""
import boto3
from botocore.exceptions import ClientError
from typing import Optional
import uuid
import os
from core.config import settings


class StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket_name = settings.S3_BUCKET_NAME
    
    async def upload_bill_image(self, file_content: bytes, filename: str) -> str:
        """
        Upload bill image to S3
        
        Args:
            file_content: Image file content as bytes
            filename: Original filename
            
        Returns:
            Public URL of uploaded image
        """
        try:
            # Generate unique filename
            file_extension = os.path.splitext(filename)[1]
            unique_filename = f"bills/{uuid.uuid4()}{file_extension}"
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=unique_filename,
                Body=file_content,
                ContentType=self._get_content_type(file_extension)
            )
            
            # Generate public URL
            url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_filename}"
            return url
            
        except ClientError as e:
            raise Exception(f"Failed to upload to S3: {str(e)}")
    
    async def delete_bill_image(self, image_url: str) -> bool:
        """Delete bill image from S3"""
        try:
            # Extract key from URL
            key = image_url.split(f"{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/")[1]
            
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=key
            )
            return True
            
        except Exception as e:
            print(f"Failed to delete from S3: {str(e)}")
            return False
    
    def _get_content_type(self, file_extension: str) -> str:
        """Get content type based on file extension"""
        content_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        }
        return content_types.get(file_extension.lower(), 'application/octet-stream')


# Singleton instance
storage_service = StorageService()
