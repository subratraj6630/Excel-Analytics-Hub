
# 📊 Excel-Analytics-Hub

A full-stack MERN web app to upload Excel files and visualize data via interactive charts. Built with React (Vite), Tailwind CSS, Chart.js, and Express.js. Includes Google OAuth + JWT authentication, responsive UI, and real-time analytics tools.

---

## 🔧 Features
- 📁 Upload Excel (.xlsx/.xls) files
- 📊 Dynamic data visualization (Bar, Line, Pie, Doughnut, Area)
- 🧠 Select header rows (1–10/custom)
- 🎛️ X/Y axis selection, filters, search & pagination
- 🔐 Google OAuth + JWT login
- 🌙 Dark mode & Framer Motion animations
- 📤 Export chart as PNG, filtered data as CSV
- 🧠 AI Insights (coming soon)

---

## 🧰 Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Chart.js, Framer Motion, Axios
- **Backend**: Node.js, Express.js, MongoDB, JWT, Multer, XLSX
- **Auth**: Google OAuth (upcoming) + JWT
- **DB**: MongoDB with Mongoose
- **File Handling**: Multer + XLSX


## ⚙️ Setup Instructions

### 1. Clone Repo
```bash
git clone https://github.com/subratraj6630/Excel-Analytics-Hub.git
cd excel-analytics
````

### 2. Configure Environment Variables

**client/.env**

```env
VITE_API_URL=http://127.0.0.1:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

**server/.env**

```env
PORT=5000
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-secret
```

> 🔐 Make sure `.env` files are listed in `.gitignore` in both `client` and `server`.

### 3. Install Dependencies

**Frontend**

```bash
cd client
npm install
```

**Backend**

```bash
cd server
npm install
```

### 4. Run App

Start backend:

```bash
cd server
node server.js
```

Start frontend:

```bash
cd client
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Key Usage Flow

1. **Login/Register** (Google or email)
2. **Upload Excel** → file is parsed & stored
3. **Analyze** → choose headers, X/Y axes, filter data
4. **Export** → download chart as PNG or data as CSV

---

## 🧯 Troubleshooting

* ✅ Mongo error: Check Mongo URI and connection
* 🔁 CORS issue: Ensure frontend URL is allowed in backend
* ⚠️ Hydration error: Use valid React element nesting
* 🔒 JWT/Env errors: Restart servers after `.env` changes

---

## 📌 Notes

* `.env` files are used for all secrets and **ignored by Git**
* Uses `useMemo`, debounced inputs, pagination for performance
* Upcoming: AI analysis via Grok API

---

## 🤝 Contributing

1. Fork → Branch → Commit → Push → PR


---

## 📬 Contact

Feel free to open an issue or email at (subratraj6630@gmail.com).


