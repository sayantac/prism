# app/api/v1/endpoints/product_description_ai.py
import json
import logging
from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, UploadFile, File, Form, status, Body
from app.services.product_description.caption_utils import generate_caption
from app.services.product_description.model_loader import load_blip_model
from app.services.product_description.google_utils import generate_google_answer

logger = logging.getLogger(__name__)
router = APIRouter()

# Load BLIP once when this router imports
processor, model = load_blip_model()
MODEL_READY = model is not None

ALLOWED_MODES = {"description", "title", "seo", "all"}
MAX_CAPTIONS = 4


def _collect_product_context(
    name: str,
    brand: str,
    category: str,
    sku: str,
    context: str,
    language: str,
    captions: List[str],
) -> str:
    sections: List[str] = []
    if name:
        sections.append(f"Product name: {name}.")
    if brand:
        sections.append(f"Brand: {brand}.")
    if sku:
        sections.append(f"SKU or code: {sku}.")
    if category:
        sections.append(f"Category: {category}.")
    if context:
        sections.append(f"Additional merchant context: {context}.")
    if captions:
        caption_lines = " ; ".join(captions)
        sections.append(
            "Visual insights derived from product images: "
            f"{caption_lines}."
        )
    sections.append(f"Write the response in {language} language.")
    return "\n".join(sections)


def _build_prompt(mode: str, context_block: str) -> str:
    if mode == "description":
        instructions = (
            "Generate an ecommerce product description and three feature bullets. "
            "Return a JSON object with keys 'description' (string, 120-180 words) "
            "and 'bullets' (array of exactly three short bullet strings). "
            "The tone should be persuasive but factual."
        )
    elif mode == "title":
        instructions = (
            "Generate a concise ecommerce product title (max 12 words). "
            "Return a JSON object with key 'title'."
        )
    elif mode == "seo":
        instructions = (
            "Generate SEO metadata. Return a JSON object with keys "
            "'seoTitle' (60 characters max), 'seoMeta' (150-160 characters), "
            "and 'seoKeywords' (array of 5 keyword phrases)."
        )
    else:  # all
        instructions = (
            "Generate a complete ecommerce copy package. Return a JSON object with keys "
            "'description' (string, 120-180 words), 'bullets' (array of exactly three short bullet strings), "
            "'title' (string, max 12 words), 'seoTitle' (<=60 characters), 'seoMeta' (150-160 characters), "
            "and 'seoKeywords' (array of 5 keyword phrases)."
        )

    return (
        "You are an expert ecommerce copywriter. Use the provided product facts "
        "and image insights to craft high quality copy. Only respond with JSON.\n"  # noqa: E501
        f"Context:\n{context_block}\n\n{instructions}\n"
    )


def _coerce_content(mode: str, raw_text: str) -> Dict[str, Any]:
    try:
        parsed = json.loads(raw_text)
        if not isinstance(parsed, dict):
            raise ValueError("Parsed JSON is not an object")
    except Exception:
        # Fall back to wrapping raw text
        if mode == "description":
            return {"description": raw_text, "bullets": []}
        if mode == "title":
            return {"title": raw_text}
        if mode == "seo":
            return {"seoTitle": "", "seoMeta": raw_text, "seoKeywords": []}
        return {
            "description": raw_text,
            "bullets": [],
            "title": "",
            "seoTitle": "",
            "seoMeta": "",
            "seoKeywords": [],
        }

    if mode == "all":
        bullets = parsed.get("bullets")
        if isinstance(bullets, str):
            bullets = [b.strip() for b in bullets.split("\n") if b.strip()]
        if not isinstance(bullets, list):
            bullets = []

        keywords = parsed.get("seoKeywords")
        if isinstance(keywords, str):
            keywords = [k.strip() for k in keywords.split(",") if k.strip()]
        if not isinstance(keywords, list):
            keywords = []

        return {
            "description": str(parsed.get("description", "")),
            "bullets": bullets,
            "title": str(parsed.get("title", "")),
            "seoTitle": str(parsed.get("seoTitle", "")),
            "seoMeta": str(parsed.get("seoMeta", "")),
            "seoKeywords": keywords,
        }

    if mode == "description":
        bullets = parsed.get("bullets")
        if isinstance(bullets, str):
            bullets = [b.strip() for b in bullets.split("\n") if b.strip()]
        if bullets is None:
            bullets = []
        return {
            "description": str(parsed.get("description", "")),
            "bullets": bullets,
        }
    if mode == "title":
        return {"title": str(parsed.get("title", ""))}
    # seo mode
    keywords = parsed.get("seoKeywords")
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(",") if k.strip()]
    if not isinstance(keywords, list):
        keywords = []
    return {
        "seoTitle": str(parsed.get("seoTitle", "")),
        "seoMeta": str(parsed.get("seoMeta", "")),
        "seoKeywords": keywords,
    }


@router.get("/health-check", status_code=status.HTTP_200_OK)
async def health_check():
    """Simple readiness probe."""
    return {
        "status": "ok" if MODEL_READY else "warning",
        "message": "Model loaded" if MODEL_READY else "Model not loaded",
        "model_loaded": MODEL_READY,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@router.post("/generate-captions", status_code=status.HTTP_200_OK)
async def generate_captions(files: list[UploadFile] = File(...)):
    """Accept uploaded images and return their captions."""
    if not MODEL_READY:
        return {
            "status": "error",
            "message": "Model not loaded. Check /health-check.",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

    results = []
    for f in files:
        try:
            logger.info(f"Processing: {f.filename}")
            caption = generate_caption(processor, model, await f.read())
            results.append({"filename": f.filename, "caption": caption})
        except Exception as e:
            logger.error(f"❌ Failed on {f.filename}: {e}", exc_info=True)
            results.append({"filename": f.filename, "error": str(e)})

    return {
        "status": "ok",
        "results": results,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    

@router.post("/generate-answer", status_code=status.HTTP_200_OK)
async def generate_answer(
    body: dict = Body(..., example={"query": "Explain what BLIP does."})
):
   

    query = (body or {}).get("query")
    if not query:
        return {
            "status": "error",
            "message": "Missing field 'query' in request body.",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

    try:
        logger.info(f"Generating Google answer for query: {query[:80]}…")
        answer = generate_google_answer(query)
        return {
            "status": "ok",
            "query": query,
            "answer": answer,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    except Exception as e:
        logger.error(f"❌ Google generation failed: {e}", exc_info=True)
        return {
            "status": "error",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }


@router.post("/generate-product-content", status_code=status.HTTP_200_OK)
async def generate_product_content(
    mode: str = Form(..., description="One of: description, title, seo"),
    product_name: str = Form(""),
    brand: str = Form(""),
    sku: str = Form(""),
    category: str = Form(""),
    context: str = Form(""),
    language: str = Form("English"),
    files: List[UploadFile] | None = File(None),
):
    lowered_mode = (mode or "").strip().lower()
    if lowered_mode not in ALLOWED_MODES:
        return {
            "status": "error",
            "message": "Invalid mode. Use one of: description, title, seo.",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

    active_processor, active_model = processor, model
    if active_model is None or active_processor is None:
        active_processor, active_model = load_blip_model()

    caption_payload: List[Dict[str, str]] = []
    caption_texts: List[str] = []
    captions_skipped = False

    if files:
        if active_model is None or active_processor is None:
            captions_skipped = True
            logger.warning("BLIP model unavailable; skipping caption generation.")
        else:
            for upload in files[:MAX_CAPTIONS]:
                try:
                    image_bytes = await upload.read()
                    if not image_bytes:
                        continue
                    caption = generate_caption(active_processor, active_model, image_bytes)
                    caption_payload.append({
                        "filename": upload.filename,
                        "caption": caption,
                    })
                    caption_texts.append(caption)
                except Exception as caption_error:
                    logger.error(
                        f"❌ Caption generation failed for {upload.filename}: {caption_error}",
                        exc_info=True,
                    )
                    caption_payload.append({
                        "filename": upload.filename,
                        "error": str(caption_error),
                    })

    skipped_captions = captions_skipped and not caption_payload

    context_block = _collect_product_context(
        name=product_name,
        brand=brand,
        category=category,
        sku=sku,
        context=context,
        language=language,
        captions=caption_texts,
    )

    prompt = _build_prompt(lowered_mode, context_block)
    logger.info(
        "Dispatching Gemini content generation for mode=%s, product=%s",
        lowered_mode,
        product_name[:80] if product_name else "<untitled>",
    )
    raw_answer = generate_google_answer(prompt)

    if not isinstance(raw_answer, str):
        raw_answer = str(raw_answer)

    if raw_answer.startswith("Google SDK error"):
        return {
            "status": "error",
            "message": raw_answer,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "captions": caption_payload,
            "modelLoaded": active_model is not None,
        }

    content = _coerce_content(lowered_mode, raw_answer)

    return {
        "status": "ok",
        "mode": lowered_mode,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "captions": caption_payload,
        "content": content,
        "rawAnswer": raw_answer,
        "modelLoaded": active_model is not None,
        "captionsSkipped": skipped_captions,
    }
