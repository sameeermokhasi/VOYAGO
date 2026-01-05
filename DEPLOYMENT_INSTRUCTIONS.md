# 🚀 Step-by-Step Deployment Guide

You have successfully deployed the Frontend to Netlify. Now, let's deploy the Backend to **Render**.

## Phase 1: Deploy Backend to Render

1.  Go to [dashboard.render.com](https://dashboard.render.com/) and Sign Up/Log In.
2.  Click **"New +"** and select **"Web Service"**.
3.  Connect your GitHub account and select the **`voyago`** repository.
4.  Render might detect the `render.yaml` file. If so, just approve it.
    *   **If it asks for manual settings:**
    *   **Name:** `voyago-backend`
    *   **Root Directory:** `backend`
    *   **Runtime:** `Python 3`
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 10000`
    *   **Instance Type:** `Free`
5.  Click **"Create Web Service"**.
6.  Wait for the deployment to finish (it takes 2-3 minutes). You will see "Live" status.
7.  **COPY the URL** from the top left (e.g., `https://voyago-backend.onrender.com`).

---

## Phase 2: Connect Frontend to Backend

1.  Open your project in VS Code.
2.  Open `netlify.toml`.
3.  Uncomment the API rewrite block and paste your Render URL:

    ```toml
    [[redirects]]
      from = "/api/*"
      to = "https://YOUR-RENDER-URL.onrender.com/api/:splat"
      status = 200
      force = true
    ```

4.  Push this change to GitHub:
    ```bash
    git add netlify.toml
    git commit -m "config: link frontend to render backend"
    git push origin main
    ```

5.  Wait for Netlify to rebuild. **Done!** 🎉
