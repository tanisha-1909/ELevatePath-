# 🚀 ELevatePath: Your AI Career Coach 📈

**ElevatePath** is a modern, full-stack web app that acts as your personal **AI Career Coach**. Powered by **Google Gemini**, it transforms generic advice into personalized strategies, interview prep, and professional documents to help you secure your dream role.

---

## ✨ Key Features (What it Does)

* **📊 Personalized Insights:** Get custom trends, salary data, and in-demand skills for your target industry, refreshed weekly via scheduled jobs.
* **🎤 Interview Prep:** Access AI-powered assessments, track your stats, and receive actionable feedback.
* **✍️ Cover Letter Generator:** Instantly create professional, tailored cover letters for any job application.
* **📄 Resume Management:** Build, edit, and securely store multiple versions of your professional resume.

## 💻 Tech Stack (The Engine)

The app is built using a modern, scalable stack:

| Category | 💡 Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui |
| **Backend/Data** | Prisma ORM, PostgreSQL |
| **Authentication** | Clerk |
| **Artificial Intelligence** | Google Generative AI (Gemini 1.5 Flash) |
| **Background Jobs** | Inngest (for scheduled AI tasks) |

---

## ⚡ Setup & Run (Get Started)

### ⚙️ Prerequisites

You need the following installed:

* **Node.js** (v18+)
* **PostgreSQL** database
* **Git**

### 🧑‍💻 Installation

1.  **Clone the project:**
    ```bash
    git clone [https://github.com/tanisha-1909/ELevatePath-.git](https://github.com/tanisha-1909/ELevatePath-.git)
    cd ELevatePath-/elevatepath
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a **`.env`** file and add your keys (DB URL, `GEMINI_API_KEY`, Clerk keys, Inngest keys).

4.  **Run Migrations:**
    Apply the Prisma schema to your database:
    ```bash
    npx prisma migrate dev --name init
    ```

### ▶️ Run Locally

Start the development server:

```bash
npm run dev
# App runs at http://localhost:3000

### Demo link https://youtu.be/_uIVojDByPY?si=IqWBZdxaFxTvJpEu
