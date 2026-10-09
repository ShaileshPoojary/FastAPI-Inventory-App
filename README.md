# FastAPI Inventory App

A learning project for managing an inventory of products. The backend is built with FastAPI, SQLAlchemy, and PostgreSQL; the frontend uses React, TypeScript, and Vite.

![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)

## Features

- Create, view, update, and delete products.
- Validate non-negative prices and quantities.
- Report duplicate product IDs and missing products with HTTP errors.
- Search and sort the product list.
- Display API validation errors in the interface.
- Configure the backend database and frontend API URL through environment files.

## Requirements

- Python 3.13 recommended
- PostgreSQL
- Node.js 20.19+ and npm

## Backend setup

Run these commands from the project root in PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` and set the connection values for a PostgreSQL database that already exists. The application creates the `products` table if it is missing; it does not create the PostgreSQL database itself. Never commit `.env` or put real credentials in `.env.example`.

Start the API:

```powershell
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`. Interactive API documentation is available at `http://localhost:8000/docs`.

## Frontend setup

In another terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Vite runs at `http://localhost:5173`. The local frontend environment file sets `VITE_API_URL=http://localhost:8000`. For a deployment, set `VITE_API_URL` to the public backend URL when building the frontend. This value is included in the browser bundle and must not contain secrets.

## API routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/products` | List products |
| `GET` | `/products/{id}` | Get one product |
| `POST` | `/products` | Create a product; the request supplies its ID |
| `PUT` | `/products/{id}` | Update editable fields; the ID is in the URL |
| `DELETE` | `/products/{id}` | Delete a product |

Creating an existing ID returns `409 Conflict`; requests for missing products return `404 Not Found`; invalid request data returns `422 Unprocessable Entity`.

## Project layout

```text
.
├── database.py
├── database_models.py
├── main.py
├── schemas.py
├── requirements.txt
└── frontend/
    ├── src/
    ├── public/
    ├── package.json
    └── vite.config.ts
```

## Development notes

- `.env`, `.venv`, Python cache files, `frontend/node_modules`, `frontend/dist`, and coverage output are excluded by `.gitignore`.
- Keep `frontend/package-lock.json` in version control so installs use the lockfile-resolved dependency tree.
- This project currently has no automated test suite or database migration tool. SQLAlchemy `create_all()` creates missing tables but does not migrate existing schemas.
- The API currently allows the local Vite origin `http://localhost:5173` through CORS. Configure the deployed frontend origin before hosting the API publicly.
- The API has no authentication or authorization. Treat it as a local learning/demo app; do not expose it publicly with sensitive inventory data without adding access controls and deployment security.
