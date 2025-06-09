# Contributing to Video Downloader Web App

Thank you for your interest in contributing to the Video Downloader Web App! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
```bash
npm install
```
3. Install system requirements:
- yt-dlp
- ffmpeg

4. Start the development server:
```bash
npm run dev
```

## Pull Request Process

1. Create a new branch for your feature/fix:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them using conventional commits:
```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in download"
```

3. Push to your fork and create a Pull Request

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding/modifying tests
- `chore:` Maintenance tasks

## Code Style

- Use TypeScript
- Follow the existing code style
- Add comments for complex logic
- Update tests when needed

## Need Help?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase
