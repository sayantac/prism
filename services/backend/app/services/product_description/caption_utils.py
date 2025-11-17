# app/blip/caption_utils.py
from io import BytesIO
from PIL import Image
import torch

def generate_caption(processor, model, image_bytes):
    """Return a caption string for a single image."""
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            num_beams=5,
            max_new_tokens=50,
            repetition_penalty=1.2,
        )

    return processor.decode(output_ids[0], skip_special_tokens=True)