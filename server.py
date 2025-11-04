from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os
import re
import sys

app = FastAPI()

# Paths
DIST_DIR = Path(__file__).resolve().parent / "dist"
STATIC_DIR = Path(__file__).resolve().parent / "static"
TEMPLATES_DIR = STATIC_DIR / "templates"

# Validate prompt template at startup
def validate_prompt_template():
    """Validate that the prompt template exists and contains required placeholders."""
    template_name = os.getenv("PROMPT_TEMPLATE_NAME", "gpt_template1.txt")
    
    # Validate template name to prevent directory traversal
    if ".." in template_name or "/" in template_name or "\\" in template_name:
        print(f"❌ ERROR: Invalid template name '{template_name}' - contains path traversal characters", file=sys.stderr)
        sys.exit(1)
    
    template_path = TEMPLATES_DIR / template_name
    
    if not template_path.exists():
        print(f"❌ ERROR: Template '{template_name}' not found at {template_path}", file=sys.stderr)
        print(f"   Available templates in {TEMPLATES_DIR}:", file=sys.stderr)
        if TEMPLATES_DIR.exists():
            templates = list(TEMPLATES_DIR.glob("*.txt"))
            if templates:
                for t in templates:
                    print(f"   - {t.name}", file=sys.stderr)
            else:
                print("   (no .txt files found)", file=sys.stderr)
        else:
            print("   (templates directory does not exist)", file=sys.stderr)
        sys.exit(1)
    
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            template_content = f.read()
        
        # Validate that the template contains {family_tree_json} placeholder
        if '{family_tree_json}' not in template_content:
            print(f"❌ ERROR: Template '{template_name}' is missing required placeholder: {{family_tree_json}}", file=sys.stderr)
            print(f"   The template must contain {{family_tree_json}} to insert the family tree structure", file=sys.stderr)
            sys.exit(1)
        
        print(f"✓ Prompt template validated: {template_name}")
        print(f"  - Contains required placeholder: {{family_tree_json}}")
        
        # Check for optional placeholders
        optional_placeholders = ['{theme}', '{style}', '{mood}']
        found_optional = [p for p in optional_placeholders if p in template_content]
        if found_optional:
            print(f"  - Optional placeholders found: {', '.join(found_optional)}")
        
    except Exception as e:
        print(f"❌ ERROR: Failed to read template '{template_name}': {str(e)}", file=sys.stderr)
        sys.exit(1)

# Run validation at startup
validate_prompt_template()

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

# Get AI prompt template
@app.get("/api/prompt-template")
async def get_prompt_template():
    # Get template name from environment variable, default to gpt_template1.txt
    template_name = os.getenv("PROMPT_TEMPLATE_NAME", "gpt_template1.txt")
    
    # Validate template name to prevent directory traversal
    if ".." in template_name or "/" in template_name or "\\" in template_name:
        raise HTTPException(status_code=400, detail="Invalid template name")
    
    template_path = TEMPLATES_DIR / template_name
    
    if not template_path.exists():
        raise HTTPException(status_code=404, detail=f"Template '{template_name}' not found")
    
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            template_content = f.read()
        
        # Validate that the template contains {family_tree_json} placeholder
        if '{family_tree_json}' not in template_content:
            raise HTTPException(
                status_code=400, 
                detail=f"Template '{template_name}' is missing required placeholder: {{family_tree_json}}"
            )
        
        return {
            "template_name": template_name,
            "template_content": template_content,
            "has_required_placeholder": True
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading template: {str(e)}")

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
