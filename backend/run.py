import os

import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get host and port from environment or use defaults
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))

    # Run the application
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,
        lifespan="on",
    )
