# Contributing to AI Project Feedback

Thank you for your interest in contributing to **AI Project Feedback**! This guide outlines how to set up your local development environment, run tests, and submit contributions.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Local Development Setup

### Prerequisites
- **Node.js**: v20 or later
- **Python**: v3.11 or later
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/karthikeyakolli/aifeedback-web-app.git
cd aifeedback-web-app
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend Vite server starts at `http://localhost:5173`.

### 3. Backend Setup
```bash
# In another terminal from repository root
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r backend/requirements.txt  # or run directly with python
uvicorn backend.app.main:app --reload --port 8000
```
The backend API server starts at `http://localhost:8000`. API docs are available at `http://localhost:8000/docs`.

---

## Running Tests

### Backend Unit & Integration Tests
```bash
python -m pytest backend/tests -v
```

### Frontend Build & Typecheck
```bash
npm --prefix frontend run build
```

---

## Pull Request Guidelines

1. **Branch Naming**: Use descriptive names (`feature/completeness-taxonomy`, `fix/report-comparison`).
2. **Commit Messages**: Write concise, imperative commit messages (`feat: add target_user to completeness map`).
3. **Tests**: Ensure all existing tests pass before submitting your PR.
4. **Clean Code**: Zero extraneous console logs, zero symbol debris, and full TypeScript typing.

