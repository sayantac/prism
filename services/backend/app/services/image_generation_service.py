"""
Image Generation Service using Google Gemini/Imagen.

This service generates marketing images like product posters and promotional
banners using Google's Gemini/Imagen API. Supports intelligent prompt generation
based on target segments, product information, and brand guidelines.
"""
import base64
import logging
import os
import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

import aiohttp
import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class ImageType(Enum):
    """Types of images that can be generated."""

    PRODUCT_POSTER = "product_poster"
    PROMOTIONAL_BANNER = "promotional_banner"
    CATEGORY_BANNER = "category_banner"
    SEASONAL_BANNER = "seasonal_banner"


class UserSegment(Enum):
    """Target user segments for personalized images."""

    NEW_CUSTOMERS = "new_customers"
    YOUNG_ADULTS = "young_adults"
    HIGH_VALUE_CUSTOMERS = "high_value_customers"
    ELECTRONICS_ENTHUSIASTS = "electronics_enthusiasts"
    FASHION_LOVERS = "fashion_lovers"
    HOME_DECOR = "home_decor"


class DealType(Enum):
    """Types of promotional deals."""

    DISCOUNT = "discount"
    PRODUCT = "product"
    PROMOTION = "promotion"
    SEASONAL = "seasonal"


class ImageGenerationService:
    """
    Service for generating marketing images using Google Gemini/Imagen.

    Supports generating product posters, promotional banners, and other
    marketing visuals with intelligent prompt engineering based on context.
    """

    def __init__(self):
        """
        Initialize the image generation service with Gemini API client.

        Sets up the Google Generative AI client with API key from settings.
        """
        self._initialized = False
        self._initialize_client()

    def _initialize_client(self) -> None:
        """
        Initialize Google Generative AI client.

        Configures the client with API key from settings.
        """
        try:
            if settings.GOOGLE_API_KEY:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                self._initialized = True
                logger.info("Google Gemini/Imagen client initialized successfully")
            else:
                logger.warning(
                    "GOOGLE_API_KEY not configured - image generation will not work"
                )
                self._initialized = False

        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {str(e)}")
            self._initialized = False

    def generate_intelligent_prompt(
        self,
        image_type: ImageType,
        target_segment: Optional[UserSegment] = None,
        deal_type: Optional[DealType] = None,
        deal_data: Optional[Dict[str, Any]] = None,
        product_info: Optional[Dict[str, Any]] = None,
        brand_guidelines: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Generate intelligent prompt for image based on context.

        Creates a detailed prompt optimized for generating marketing images
        that resonate with the target audience and reflect brand identity.

        Args:
            image_type: Type of image to generate
            target_segment: Target user segment for personalization
            deal_type: Type of deal/promotion
            deal_data: Additional deal information
            product_info: Product details to include
            brand_guidelines: Brand colors, style preferences

        Returns:
            Detailed prompt string for image generation

        Example:
            >>> service = ImageGenerationService()
            >>> prompt = service.generate_intelligent_prompt(
            ...     image_type=ImageType.PRODUCT_POSTER,
            ...     product_info={"name": "Wireless Headphones", "category": "Electronics"}
            ... )
        """
        base_style = "Professional e-commerce image, high-quality, modern design, clean composition, photorealistic"

        # Segment-specific styling
        segment_styles = {
            UserSegment.NEW_CUSTOMERS: "welcoming and friendly, bright colors, approachable design, trust-building elements",
            UserSegment.YOUNG_ADULTS: "trendy and modern, vibrant colors, contemporary design, energetic aesthetic",
            UserSegment.HIGH_VALUE_CUSTOMERS: "luxury aesthetic, sophisticated palette, minimalist design, premium feel, elegant",
            UserSegment.ELECTRONICS_ENTHUSIASTS: "tech-focused, modern digital aesthetic, sleek themes, innovative style",
            UserSegment.FASHION_LOVERS: "stylish and fashionable, trendsetting design, aesthetic appeal, modern fashion",
            UserSegment.HOME_DECOR: "cozy and inviting, warm colors, homey atmosphere, comfortable aesthetic",
        }

        # Deal-specific elements
        deal_elements = {
            DealType.DISCOUNT: "prominent discount display, savings emphasis, price highlights, limited time urgency",
            DealType.PRODUCT: "product showcase, feature highlights, lifestyle context, quality demonstration",
            DealType.PROMOTION: "promotional theme, special event styling, exclusive offer indicators",
            DealType.SEASONAL: "seasonal theme, holiday aesthetics, timely relevance, festive elements",
        }

        # Image type specific requirements
        type_requirements = {
            ImageType.PRODUCT_POSTER: "product-focused layout, clear product visibility, hero product positioning",
            ImageType.PROMOTIONAL_BANNER: "9:6 aspect ratio, horizontal banner layout, text-friendly composition",
            ImageType.CATEGORY_BANNER: "category theme, multiple product suggestions, collection showcase",
            ImageType.SEASONAL_BANNER: "seasonal decorations, holiday theme, festive atmosphere",
        }

        prompt_parts = [base_style]

        # Add image type requirements
        if image_type:
            prompt_parts.append(type_requirements.get(image_type, ""))

        # Add segment styling
        if target_segment:
            prompt_parts.append(
                f"Target audience: {segment_styles.get(target_segment, '')}"
            )

        # Add deal elements
        if deal_type:
            prompt_parts.append(f"Campaign type: {deal_elements.get(deal_type, '')}")

        # Add product context
        if product_info:
            product_context = f"Product: {product_info.get('name', 'featured product')}"
            if product_info.get("category"):
                product_context += f", category: {product_info['category']}"
            if product_info.get("key_features"):
                features = product_info["key_features"]
                if isinstance(features, list):
                    product_context += f", features: {', '.join(features[:3])}"
                else:
                    product_context += f", features: {features}"
            prompt_parts.append(product_context)

        # Add deal data
        if deal_data:
            if deal_type == DealType.DISCOUNT and "discount" in deal_data:
                prompt_parts.append(
                    f"Featuring {deal_data['discount']}% discount prominently"
                )
            elif deal_type == DealType.PRODUCT and "product_name" in deal_data:
                prompt_parts.append(
                    f"Showcasing {deal_data['product_name']} as hero product"
                )
            elif "promotion_name" in deal_data:
                prompt_parts.append(f"Promoting {deal_data['promotion_name']} campaign")

        # Add brand guidelines
        if brand_guidelines:
            brand_elements = []
            if "primary_color" in brand_guidelines:
                brand_elements.append(
                    f"primary brand color: {brand_guidelines['primary_color']}"
                )
            if "secondary_color" in brand_guidelines:
                brand_elements.append(
                    f"secondary color: {brand_guidelines['secondary_color']}"
                )
            if "style" in brand_guidelines:
                brand_elements.append(f"brand style: {brand_guidelines['style']}")
            if brand_elements:
                prompt_parts.append(f"Brand elements: {', '.join(brand_elements)}")

        # Technical specifications
        technical_specs = [
            "high resolution",
            "professional photography style",
            "commercial advertising quality",
            "proper visual hierarchy",
            "clear focal point",
        ]
        prompt_parts.extend(technical_specs)

        final_prompt = ". ".join([p for p in prompt_parts if p]) + "."
        return final_prompt

    async def generate_image(
        self,
        prompt: str,
        output_path: Optional[str] = None,
        aspect_ratio: str = "1:1",
        retries: int = 0,
    ) -> Dict[str, Any]:
        """
        Generate image using Google Imagen API via AI Studio.

        Uses Google AI Studio's Imagen API to generate high-quality marketing images
        based on text prompts. Automatically saves images to local storage.

        Args:
            prompt: Text prompt describing the desired image
            output_path: Optional path to save the image
            aspect_ratio: Image aspect ratio (e.g., "1:1", "16:9", "9:16")
            retries: Number of retries if generation fails

        Returns:
            Dictionary with generation results:
                - success: bool indicating success/failure
                - image_base64: Base64 encoded image data (if successful)
                - filename: Saved file path (if output_path provided)
                - prompt_used: The prompt that was used
                - error: Error message (if failed)

        Example:
            >>> service = ImageGenerationService()
            >>> result = await service.generate_image(
            ...     prompt="Professional product photo of wireless headphones",
            ...     output_path="static/generated/headphones.png"
            ... )
        """
        if not self._initialized:
            return {
                "success": False,
                "error": "Google Gemini API not initialized. Please configure GOOGLE_API_KEY.",
                "prompt_used": prompt,
            }

        max_retries = retries or settings.MAX_IMAGE_GENERATION_RETRIES

        for attempt in range(max_retries):
            try:
                logger.info(f"Generating image with Imagen API (attempt {attempt + 1}/{max_retries})")
                logger.debug(f"Prompt: {prompt[:200]}...")

                # Google AI Studio Imagen API endpoint
                # Note: Imagen 3 is available via Google AI Studio API
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_IMAGE_MODEL}:generateImages"

                headers = {
                    "Content-Type": "application/json",
                }

                # Map aspect ratio to supported values
                aspect_ratio_map = {
                    "1:1": "1:1",
                    "16:9": "16:9",
                    "9:16": "9:16",
                    "4:3": "4:3",
                    "3:4": "3:4",
                }
                mapped_ratio = aspect_ratio_map.get(aspect_ratio, "1:1")

                payload = {
                    "prompt": prompt,
                    "number_of_images": 1,
                    "aspect_ratio": mapped_ratio,
                    "safety_filter_level": "block_only_high",
                    "person_generation": "allow_adult",
                }

                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        url,
                        json=payload,
                        headers=headers,
                        params={"key": settings.GOOGLE_API_KEY},
                        timeout=aiohttp.ClientTimeout(total=60)
                    ) as response:
                        if response.status == 200:
                            result = await response.json()

                            # Extract generated image
                            if "generatedImages" in result and len(result["generatedImages"]) > 0:
                                image_data = result["generatedImages"][0]

                                # Image is returned as base64 in 'imageBytes' field
                                if "imageBytes" in image_data:
                                    image_base64 = image_data["imageBytes"]

                                    # Save to file if output path provided
                                    saved_path = None
                                    if output_path:
                                        try:
                                            # Create directory if needed
                                            os.makedirs(os.path.dirname(output_path), exist_ok=True)

                                            # Decode and save
                                            image_bytes = base64.b64decode(image_base64)
                                            with open(output_path, "wb") as f:
                                                f.write(image_bytes)

                                            saved_path = output_path
                                            logger.info(f"Image saved to: {saved_path}")
                                        except Exception as save_error:
                                            logger.error(f"Error saving image: {str(save_error)}")

                                    return {
                                        "success": True,
                                        "image_base64": image_base64,
                                        "filename": saved_path,
                                        "prompt_used": prompt,
                                        "aspect_ratio": mapped_ratio,
                                    }
                                else:
                                    logger.error("Response missing imageBytes field")
                                    error_msg = "Invalid response format from Imagen API"
                            else:
                                logger.error("Response missing generatedImages field")
                                error_msg = "No images generated by Imagen API"
                        else:
                            error_text = await response.text()
                            logger.error(f"Imagen API error ({response.status}): {error_text}")
                            error_msg = f"API returned status {response.status}: {error_text[:200]}"

                        # If we got here, there was an error
                        if attempt < max_retries - 1:
                            logger.info(f"Retrying image generation...")
                            continue
                        else:
                            return {
                                "success": False,
                                "error": error_msg,
                                "prompt_used": prompt,
                            }

            except aiohttp.ClientError as e:
                logger.error(
                    f"Network error generating image (attempt {attempt + 1}/{max_retries}): {str(e)}",
                    exc_info=True,
                )
                error_msg = f"Network error: {str(e)}"

            except Exception as e:
                logger.error(
                    f"Error generating image (attempt {attempt + 1}/{max_retries}): {str(e)}",
                    exc_info=True,
                )
                error_msg = str(e)

            if attempt == max_retries - 1:
                return {
                    "success": False,
                    "error": error_msg,
                    "prompt_used": prompt,
                }

        return {
            "success": False,
            "error": "Max retries exceeded",
            "prompt_used": prompt,
        }

    async def generate_product_poster(
        self,
        product_name: str,
        product_category: Optional[str] = None,
        product_features: Optional[list] = None,
        target_segment: Optional[UserSegment] = None,
        brand_guidelines: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a product poster image.

        Args:
            product_name: Name of the product
            product_category: Product category
            product_features: List of key features
            target_segment: Target user segment
            brand_guidelines: Brand styling guidelines

        Returns:
            Generation result dictionary

        Example:
            >>> result = await service.generate_product_poster(
            ...     product_name="Wireless Gaming Mouse",
            ...     product_category="Electronics",
            ...     product_features=["RGB lighting", "Ultra responsive", "Ergonomic"]
            ... )
        """
        product_info = {
            "name": product_name,
            "category": product_category,
            "key_features": product_features or [],
        }

        prompt = self.generate_intelligent_prompt(
            image_type=ImageType.PRODUCT_POSTER,
            target_segment=target_segment,
            product_info=product_info,
            brand_guidelines=brand_guidelines,
        )

        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = "".join(c if c.isalnum() else "_" for c in product_name[:30])
        filename = f"poster_{safe_name}_{timestamp}.png"
        output_path = os.path.join(settings.IMAGE_STORAGE_PATH, filename)

        return await self.generate_image(
            prompt=prompt, output_path=output_path, aspect_ratio="1:1"
        )

    async def generate_promotional_banner(
        self,
        target_segment: UserSegment,
        deal_type: DealType,
        deal_data: Optional[Dict[str, Any]] = None,
        product_info: Optional[Dict[str, Any]] = None,
        brand_guidelines: Optional[Dict[str, Any]] = None,
        custom_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate a promotional banner image.

        Args:
            target_segment: Target user segment
            deal_type: Type of promotion
            deal_data: Deal-specific information
            product_info: Product details
            brand_guidelines: Brand styling guidelines
            custom_prompt: Optional custom prompt override

        Returns:
            Generation result dictionary

        Example:
            >>> result = await service.generate_promotional_banner(
            ...     target_segment=UserSegment.YOUNG_ADULTS,
            ...     deal_type=DealType.DISCOUNT,
            ...     deal_data={"discount": 25, "product_name": "Summer Collection"}
            ... )
        """
        if custom_prompt:
            prompt = custom_prompt
        else:
            prompt = self.generate_intelligent_prompt(
                image_type=ImageType.PROMOTIONAL_BANNER,
                target_segment=target_segment,
                deal_type=deal_type,
                deal_data=deal_data,
                product_info=product_info,
                brand_guidelines=brand_guidelines,
            )

        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"banner_{target_segment.value}_{deal_type.value}_{timestamp}.png"
        output_path = os.path.join(settings.IMAGE_STORAGE_PATH, filename)

        return await self.generate_image(
            prompt=prompt, output_path=output_path, aspect_ratio="16:9"
        )

    def save_generated_image(
        self, image_data: str, filename: str, subdirectory: Optional[str] = None
    ) -> str:
        """
        Save base64 encoded image to local storage.

        Args:
            image_data: Base64 encoded image data
            filename: Filename to save as
            subdirectory: Optional subdirectory within IMAGE_STORAGE_PATH

        Returns:
            Relative URL path to the saved image

        Example:
            >>> url = service.save_generated_image(
            ...     image_data="data:image/png;base64,iVBORw0KG...",
            ...     filename="product_123.png",
            ...     subdirectory="products"
            ... )
        """
        try:
            # Create directory path
            if subdirectory:
                save_dir = os.path.join(settings.IMAGE_STORAGE_PATH, subdirectory)
            else:
                save_dir = settings.IMAGE_STORAGE_PATH

            os.makedirs(save_dir, exist_ok=True)

            # Full file path
            file_path = os.path.join(save_dir, filename)

            # Remove data URL prefix if present
            if "," in image_data:
                image_data = image_data.split(",")[1]

            # Decode and save
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(image_data))

            # Return relative URL path
            if subdirectory:
                return f"/{settings.IMAGE_STORAGE_PATH}/{subdirectory}/{filename}"
            else:
                return f"/{settings.IMAGE_STORAGE_PATH}/{filename}"

        except Exception as e:
            logger.error(f"Error saving image: {str(e)}", exc_info=True)
            raise

    def get_segment_templates(self) -> Dict[UserSegment, str]:
        """
        Get pre-defined prompt templates for each user segment.

        Returns:
            Dictionary mapping segments to template prompts

        Example:
            >>> templates = service.get_segment_templates()
            >>> high_value_template = templates[UserSegment.HIGH_VALUE_CUSTOMERS]
        """
        return {
            UserSegment.HIGH_VALUE_CUSTOMERS: (
                "Luxury e-commerce banner with sophisticated black and gold design, "
                "premium product showcase, elegant typography, minimalist layout, "
                "high-end aesthetic, professional photography style"
            ),
            UserSegment.NEW_CUSTOMERS: (
                "Welcoming e-commerce banner with bright, friendly colors, "
                "approachable design, clear welcome messaging, inviting atmosphere, "
                "trust-building elements, modern clean layout"
            ),
            UserSegment.ELECTRONICS_ENTHUSIASTS: (
                "Tech-focused banner with modern digital aesthetic, sleek technology themes, "
                "innovative design, cutting-edge style, gadget-oriented imagery, "
                "futuristic elements"
            ),
            UserSegment.YOUNG_ADULTS: (
                "Trendy modern banner with vibrant colors, contemporary design, "
                "social media style, energetic and youthful aesthetic, "
                "bold typography, dynamic layout"
            ),
            UserSegment.FASHION_LOVERS: (
                "Fashion-forward banner with stylish aesthetic, trendsetting design, "
                "editorial photography style, sophisticated color palette, "
                "runway-inspired layout"
            ),
            UserSegment.HOME_DECOR: (
                "Cozy home-themed banner with warm inviting colors, comfortable aesthetic, "
                "lifestyle photography, homey atmosphere, interior design elements"
            ),
        }


# Singleton instance for reuse across the application
_image_service_instance = None


def get_image_generation_service() -> ImageGenerationService:
    """
    Get singleton instance of ImageGenerationService.

    Returns:
        ImageGenerationService instance

    Example:
        >>> service = get_image_generation_service()
        >>> result = await service.generate_product_poster("Product Name")
    """
    global _image_service_instance
    if _image_service_instance is None:
        _image_service_instance = ImageGenerationService()
    return _image_service_instance
