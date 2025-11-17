# app/blip/model_loader.py
import logging
import os
from transformers import BlipProcessor, BlipForConditionalGeneration

logger = logging.getLogger(__name__)

HF_MODEL_NAME = "Salesforce/blip-image-captioning-base"
HF_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")

processor = None
model = None
loaded = False


def load_blip_model():
    """
    Download and initialize the BLIP model and processor from Hugging Face Hub.
    """
    global processor, model, loaded
    if loaded:
        return processor, model

    try:
        logger.info(f"Downloading BLIP model from Hugging Face Hub: {HF_MODEL_NAME}")
        processor = BlipProcessor.from_pretrained(HF_MODEL_NAME, token=HF_TOKEN)
        model = BlipForConditionalGeneration.from_pretrained(HF_MODEL_NAME, token=HF_TOKEN)
        model.eval()
        loaded = True
        logger.info(" BLIP model loaded successfully from Hugging Face Hub.")
    except Exception as e:
        logger.error(f"BLIP model download failed: {e}", exc_info=True)
        processor = model = None
        loaded = False

    return processor, model