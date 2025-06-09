# Initialize Git repository and set up GitHub
$ErrorActionPreference = "Stop"

# Initialize git repository if not already initialized
if (-not (Test-Path .git)) {
    Write-Host "Initializing Git repository..."
    git init
}

# Stage all files
Write-Host "Staging files..."
git add .

# Create initial commit
Write-Host "Creating initial commit..."
git commit -m "feat: initial commit

- Set up Next.js application with TypeScript
- Add video download functionality using yt-dlp
- Implement modern UI with Tailwind CSS and shadcn/ui
- Add deployment configurations
- Set up GitHub workflows and templates"

Write-Host "`nRepository is ready for GitHub!"
Write-Host "`nNext steps:"
Write-Host "1. Create a new repository on GitHub"
Write-Host "2. Run these commands to push to GitHub:"
Write-Host "   git remote add origin https://github.com/USERNAME/REPO.git"
Write-Host "   git push -u origin main"
