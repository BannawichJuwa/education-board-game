# Deploy to Google Cloud (Cloud Run + Cloud SQL MySQL)

Run these commands in **Google Cloud Shell** (console.cloud.google.com -> the `>_` button).
Replace the values in CAPITALS. Region `asia-southeast1` = Singapore.

## 1. Project and services
```bash
gcloud config set project PROJECT_ID
gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## 2. Cloud SQL (MySQL) database
```bash
gcloud sql instances create eduboard-db --database-version=MYSQL_8_0 --edition=enterprise \
  --tier=db-f1-micro --region=asia-southeast1
gcloud sql databases create eduboard --instance=eduboard-db
gcloud sql users create eduboard --instance=eduboard-db --password=DB_PASSWORD
```
The tables are created automatically from `schema.sql` when the app starts.

## 3. Get the code and deploy
```bash
git clone https://github.com/YOUR_GITHUB/YOUR_REPO.git
cd YOUR_REPO
gcloud run deploy eduboard --source . --region=asia-southeast1 --allow-unauthenticated \
  --memory=1Gi --max-instances=1 \
  --add-cloudsql-instances=PROJECT_ID:asia-southeast1:eduboard-db \
  --set-env-vars="^@^DB_URL=jdbc:mysql:///eduboard?cloudSqlInstance=PROJECT_ID:asia-southeast1:eduboard-db&socketFactory=com.google.cloud.sql.mysql.SocketFactory@DB_USER=eduboard@DB_PASSWORD=DB_PASSWORD@APP_TOKEN_SECRET=ANY_LONG_RANDOM_TEXT"
```
At the end it prints the public URL (https://eduboard-xxxx.a.run.app). Open it, register, and play.

## 4. Check
- `URL/api/games` shows the 3 games -> the app reached Cloud SQL.
- `URL/swagger-ui.html` shows every endpoint.
- If something fails: `gcloud run services logs read eduboard --region=asia-southeast1 --limit=50`

## 5. After grading (stop the cost)
```bash
gcloud sql instances delete eduboard-db
gcloud run services delete eduboard --region=asia-southeast1
```
