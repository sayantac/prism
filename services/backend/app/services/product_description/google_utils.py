# app/services/product_description/google_utils.py
import os, ssl, certifi
import google.generativeai as genai

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# CA_BUNDLE = os.getenv("SSL_CERT_FILE", "/etc/ssl/certs/ca-certificates.crt")

# ssl_context = ssl.create_default_context(cafile=CA_BUNDLE)
# ssl_context.load_verify_locations(cafile=CA_BUNDLE)
# os.environ["GRPC_DEFAULT_SSL_ROOTS_FILE_PATH"] = CA_BUNDLE

genai.configure(api_key=GOOGLE_API_KEY, transport="rest")

def generate_google_answer(query: str) -> str:
    try:
        model = genai.GenerativeModel("models/gemini-2.0-flash")
        response = model.generate_content(query)
        if hasattr(response, "text"):
            return response.text.strip()
        return "No text field returned; check API response."
    except Exception as e:
        return f"Google SDK error: {e}"
