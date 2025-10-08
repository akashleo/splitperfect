"""
OCR Service for extracting text from bill images
Supports both Tesseract (local) and Google Cloud Vision API
"""
import os
from typing import Optional
from PIL import Image
import pytesseract
from core.config import settings


class OCRService:
    def __init__(self):
        self.use_google_vision = bool(settings.GOOGLE_APPLICATION_CREDENTIALS)
        
    async def extract_text_from_image(self, image_path: str) -> str:
        """
        Extract text from an image using OCR
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Extracted text as string
        """
        if self.use_google_vision:
            return await self._extract_with_google_vision(image_path)
        else:
            return await self._extract_with_tesseract(image_path)
    
    async def _extract_with_tesseract(self, image_path: str) -> str:
        """Extract text using Tesseract OCR"""
        try:
            image = Image.open(image_path)
            text = pytesseract.image_to_string(image)
            return text
        except Exception as e:
            raise Exception(f"Tesseract OCR failed: {str(e)}")
    
    async def _extract_with_google_vision(self, image_path: str) -> str:
        """Extract text using Google Cloud Vision API"""
        try:
            from google.cloud import vision
            
            client = vision.ImageAnnotatorClient()
            
            with open(image_path, 'rb') as image_file:
                content = image_file.read()
            
            image = vision.Image(content=content)
            response = client.text_detection(image=image)
            texts = response.text_annotations
            
            if texts:
                return texts[0].description
            return ""
            
        except Exception as e:
            raise Exception(f"Google Vision API failed: {str(e)}")


# Singleton instance
ocr_service = OCRService()
