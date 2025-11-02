from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

app = FastAPI()

# Paths
DIST_DIR = Path(__file__).resolve().parent / "dist"
STATIC_DIR = Path(__file__).resolve().parent / "static"

# Mount static assets only if they exist
if (DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

# Mount static folder for icons and other static files
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok"}

# Serve React app for all other routes
@app.get("/{full_path:path}")
async def serve_app(full_path: str):
    index_file = DIST_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=503, detail="App not built. Run 'npm run build' first.")
    return FileResponse(index_file)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
