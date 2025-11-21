# app/blip/caption_utils.py
from io import BytesIO
import types
from urllib import response
from PIL import Image
import torch
import os
import google.generativeai as genai
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# CA_BUNDLE = os.getenv("SSL_CERT_FILE", "/etc/ssl/certs/ca-certificates.crt")

# ssl_context = ssl.create_default_context(cafile=CA_BUNDLE)
# ssl_context.load_verify_locations(cafile=CA_BUNDLE)
# os.environ["GRPC_DEFAULT_SSL_ROOTS_FILE_PATH"] = CA_BUNDLE

genai.configure(api_key=GOOGLE_API_KEY, transport="rest")


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

def generate_caption_gemini(image_bytes):
    client = genai.Client()
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[
        types.Part.from_bytes(
            data=image_bytes,
            mime_type='image/jpeg',
        ),
        'Caption this image.'
        ]
    )
    return response.text