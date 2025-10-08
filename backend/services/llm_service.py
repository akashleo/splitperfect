"""
LLM Service for parsing OCR text into structured bill data
Supports OpenAI GPT-4o-mini (can be extended for Gemini)
"""
import json
from typing import Dict, Any
from openai import OpenAI
from core.config import settings


class LLMService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
    async def parse_bill_text(self, ocr_text: str) -> Dict[str, Any]:
        """
        Parse OCR extracted text into structured bill data
        
        Args:
            ocr_text: Raw text extracted from bill image
            
        Returns:
            Structured bill data with items, amounts, etc.
        """
        prompt = self._create_parsing_prompt(ocr_text)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a bill parsing assistant. Extract line items from receipts and return valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            result = json.loads(response.choices[0].message.content)
            return self._validate_and_format(result)
            
        except Exception as e:
            raise Exception(f"LLM parsing failed: {str(e)}")
    
    def _create_parsing_prompt(self, ocr_text: str) -> str:
        """Create prompt for LLM to parse bill"""
        return f"""
Parse the following receipt/bill text and extract all line items with their details.

Receipt Text:
{ocr_text}

Return a JSON object with this exact structure:
{{
    "merchant_name": "store or restaurant name",
    "date": "transaction date if found",
    "items": [
        {{
            "description": "item name or description",
            "quantity": 1,
            "unit_price": 0.00,
            "total": 0.00
        }}
    ],
    "subtotal": 0.00,
    "tax": 0.00,
    "total_amount": 0.00
}}

Rules:
- Extract ALL line items with prices
- If quantity is not specified, use 1
- Calculate totals accurately
- Use 0.00 for any missing numeric values
- Return only valid JSON, no additional text
"""
    
    def _validate_and_format(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and format LLM response"""
        # Ensure required fields exist
        if "items" not in result:
            result["items"] = []
        
        if "total_amount" not in result:
            result["total_amount"] = sum(item.get("total", 0) for item in result["items"])
        
        # Validate each item
        for item in result["items"]:
            if "description" not in item:
                item["description"] = "Unknown Item"
            if "quantity" not in item:
                item["quantity"] = 1
            if "unit_price" not in item:
                item["unit_price"] = 0.0
            if "total" not in item:
                item["total"] = item["quantity"] * item["unit_price"]
        
        return result


# Singleton instance
llm_service = LLMService()
