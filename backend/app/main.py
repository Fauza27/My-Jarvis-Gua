import os
import sys
from pathlib import Path

# Add parent directory (backend) to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

import uvicorn

from app.core.config import get_settings

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    settings = get_settings()
    is_reload = not settings.is_production
    
    uvicorn.run(
        "app.core.application:create_app",
        host="0.0.0.0",
        port=port,
        reload=is_reload,
        factory=True,
        reload_dirs=[str(backend_dir / "app")] if is_reload else None,
    )