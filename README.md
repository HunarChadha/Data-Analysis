# Contour

A full-stack web app for analyzing tabular data: upload a CSV, TSV, Excel or JSON
file and get back automatic column classification, statistical summaries, and
interactive charts — plus a built-in AI chat assistant ("Vortex") for asking
questions about your data.

## Features

- **Data upload & analysis** — upload a file and every column is automatically
  classified by a trained PyTorch model, which picks the right visualization
  (bar chart, pie chart, or histogram) for each column.
- **Interactive charts** — bar, pie, and histogram views rendered with Recharts,
  including outlier bucketing and "Others" grouping for high-cardinality columns.
- **AI assistant (Vortex)** — a Gemini-backed chat with streaming responses,
  Markdown rendering, and math (KaTeX) support.
- **Chat history** — save conversations under a title, browse them in a sidebar,
  and reopen them later. Conversations are owned by the user who created them;
  reads and writes are ownership-checked server-side.
- **Accounts** — email/password signup and login.
- **Dark theme UI** — consistent charcoal + amber design across landing, auth,
  dashboard, analysis, and chatbot pages.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, Recharts, CSS Modules |
| Backend | Python, FastAPI, Uvicorn, MySQL Connector |
| ML | PyTorch, scikit-learn, pandas, NumPy |
| Chatbot | Google Gemini (`google-genai`), streamed via `StreamingResponse` |
| Database | MySQL (`USER_DATA` database) |

## Project structure

```
├── src/
│   ├── Layout/            # Page components (routes)
│   │   ├── App.tsx          # Landing page (hero, live chart, chart gallery)
│   │   ├── LoginPage.tsx    # Login
│   │   ├── SignupPage.tsx   # Signup
│   │   ├── WelcomePage.tsx  # Name capture → creates user account
│   │   ├── DashBoard.tsx    # File upload + actions
│   │   ├── AnalyzePage.tsx  # Renders generated charts
│   │   └── Chatbot.tsx      # AI chat with sidebar history
│   ├── style/             # CSS modules + shared landing styles
│   ├── Main/              # Frontend logic
│   │   ├── FileHanding.ts   # File upload
│   │   ├── DataManagement.ts# Turns API results into chart components
│   │   ├── ChartTypes.tsx   # Recharts bar/pie/empty chart builders
│   │   ├── chatbot.ts       # Chat save / history / streaming client
│   │   ├── Login.ts, userInfo.ts
│   │   └── url.ts           # Backend endpoint map (localhost:8000)
│   └── Server/            # FastAPI backend (run with cwd = this folder)
│       ├── Server.py        # Routes
│       ├── init.py          # Pydantic request models
│       ├── userdata.py      # MySQL data access (users, conversations, messages)
│       ├── Chatbot/         # Gemini client 
│       └── AI/              # Column-classification model
│           ├── main.py        # Entry point: parse file → features → predictions
│           ├── Extract.py     # Per-column feature extraction
│           ├── ManipulateData.py # Aggregates columns into chart-ready data
│           ├── Vortex.py      # Network definition, model loading, preprocessing
│           └── Train.py       # Training script (produces model.pth)
├── app.py                 # (empty placeholder)
└── package.json
```

## Prerequisites

- Node.js (with npm)
- Python 3.10+ (a `.venv` is already set up in this repo)
- MySQL server running locally
- A Google Gemini API key

## Setup

### 1. Frontend

```bash
npm install
npm run dev        # serves on http://localhost:5173 (the backend's allowed CORS origin)
```

### 2. Backend

```powershell
.\.venv\Scripts\activate
pip install fastapi uvicorn mysql-connector-python pandas numpy scikit-learn torch google-genai python-dotenv openpyxl
```

### 3. Database

The frontend indexes `SELECT *` results by column position, so **column order
matters**. Create the tables in this exact column order:

```sql
CREATE DATABASE IF NOT EXISTS USER_DATA;
USE USER_DATA;

CREATE TABLE DATA (
    NAME     VARCHAR(255),
    EMAIL    VARCHAR(255),
    PASSWORD VARCHAR(255),
    ID       INT AUTO_INCREMENT PRIMARY KEY
);

CREATE TABLE CONVERSATIONS (
    ID      INT AUTO_INCREMENT PRIMARY KEY,
    USER_ID INT,
    TITLE   VARCHAR(255)
);

CREATE TABLE MESSAGES (
    ID              INT AUTO_INCREMENT PRIMARY KEY,
    ROLE            VARCHAR(16),
    CONVERSATION_ID INT,
    CONTENT         TEXT,
    IND             INT,
    CONSTRAINT fk_conv FOREIGN KEY (CONVERSATION_ID)
        REFERENCES CONVERSATIONS (ID)
);
```

### 4. Run the backend

```powershell
cd src/Server
uvicorn Server:app --port 8000 --reload
```

## How it works

1. **Signup → Welcome** — the signup form collects email/password, the Welcome
   page asks for a name, and the account is created via `POST /Welcome` (the
   new numeric `user_id` is stored in `localStorage`).
2. **Upload** — `DashBoard` posts the file to `POST /dashboard`.
3. **Classification** — the backend extracts per-column features, runs them
   through the trained network, and labels each column as `bar`, `pie`, or
   `histogram`.
4. **Charts** — the labels plus aggregated data come back to the frontend,
   which builds the corresponding Recharts components on the Analyze page.
5. **Chatbot** — messages stream from `POST /chatbot` (Gemini, token by token).
   Saving a chat creates a conversation row (`POST /chatbot/saveConv`) that
   returns the conversation ID, then posts the messages to
   `POST /chatbot/saveChat`. History lives in the sidebar (`POST
   /chatbot/chats`), and reopening one fetches its messages
   (`POST /chatbot/message`).

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/Welcome` | Create user account, return new user id |
| POST | `/login` | Email/password login, returns user id or error code |
| POST | `/dashboard` | Upload a data file, get chart labels + data |
| POST | `/chatbot` | Streamed AI response for a prompt |
| POST | `/chatbot/chats` | List a user's conversations |
| POST | `/chatbot/message` | Fetch a conversation's messages (ownership-checked) |
| POST | `/chatbot/saveConv` | Create a conversation, return its id |
| POST | `/chatbot/saveChat` | Save messages (delete + reinsert; ownership-checked) |

## Security notes / known limitations

- Chat history is not saved automatically; the user must click **Save Chat**.
- Revisiting the Welcome page inserts a new account (no duplicate-email check).
- The column classifier is trained on 15 features / 5 classes; unsupported or
  fully-empty columns are skipped.