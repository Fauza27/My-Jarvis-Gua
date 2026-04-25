import os
import sys
from pathlib import Path

# Add parent directory (backend) to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "app.core.application:create_app",
        host="0.0.0.0",
        port=port,
        reload=True,
        factory=True,
        reload_dirs=[str(backend_dir / "app")],
    )