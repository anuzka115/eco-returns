## Run Instructions

Follow these steps **in order**:

### 1. Start the ML Server (Python)

```
cd ML_server
python -m venv venv
venv\Scripts\activate   # Windows
# or: source venv/bin/activate (Mac/Linux)
pip install -r requirements.txt
python api_server.py
```

Runs at: **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

### 2. Start the SaaS Backend (Node.js)

```
cd saas-backend
npm install
node server.js
```

Runs at: **[http://127.0.0.1:4000](http://127.0.0.1:4000)**

Admin API key (default):

```
dev_admin_key
```

---

### 3. Start the Ecommerce Frontend

```
cd eco-returns-frontend
npm install
npm run dev
```

Open: **[http://localhost:5173](http://localhost:5173)**

---

### 4. Start the Admin Frontend

```
cd saas-admin-frontend
npm install
npm run dev
```

Open: **[http://localhost:5174](http://localhost:5174)**

Login using your **Admin API Key**.

