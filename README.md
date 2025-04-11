# Crossword Puzzle Game for SICASA

Welcome to the **Crossword Puzzle Game** designed and developed for **SICASA**. This interactive web application brings a fun and engaging crossword experience to users, complementing SICASA's news articles.

## 🚀 Project Overview
The crossword puzzle game is integrated within SICASA's news platform, allowing readers to play puzzles directly while reading their favorite articles. The game includes real-time validation, smooth user interaction, and an admin panel for managing questions and monitoring user progress.

## 🛠️ Technologies Used
The application is built using modern web technologies for both the frontend and backend:

**Frontend:**
- **Vite** + **React** (with TypeScript) for a fast and efficient development experience.
- **TailwindCSS** for sleek and responsive UI design.

**Backend:**
- **Express.js** for API management and routing.
- **MongoDB** as the database for storing crossword puzzles, user data, and game sessions.

## 🌟 Features
- **Interactive Crossword Board**: Users can play the crossword puzzle seamlessly.
- **Real-time Validation**: Answers are validated instantly.
- **Admin Panel**: Admins can add, edit, or delete puzzles.
- **Game Progress Tracking**: Monitor user activity and game sessions.
- **Secure Authentication**: Ensure data security with proper authentication and authorization.

## 🧑‍💻 Installation and Setup
Follow these steps to run the application locally:

### Prerequisites
- Node.js (v18 or later)
- MongoDB installed and running locally
- Vite CLI

### Clone the Repository
```bash
git clone https://github.com/Balajisix/crossword-game.git
cd crossword-game
```

### Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Environment Setup
Create `.env` files in both `frontend` and `backend` folders.

#### Frontend `.env`
```
VITE_BASE_URL=http://localhost:5000
```

#### Backend `.env`
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/crossword-game
```

### Run the Application
```bash
# Start backend server
cd backend
npm start

# Start frontend server
cd ../frontend
npm run dev
```
Visit `http://localhost:5173` to access the application.

## 🚦 API Endpoints
| Method   | Endpoint                     | Description                     |
|-----------|------------------------------|---------------------------------|
| GET      | /api/admin/questions          | Fetch all crossword questions  |
| POST     | /api/admin/questions          | Create a new question          |
| GET      | /api/admin/sessions           | Get all game sessions          |
| GET      | /api/admin/users              | Get all users and their scores |

## 📝 License
This project is licensed under the MIT License.

---

Enjoy solving puzzles and have fun with the Crossword Puzzle Game!

For any queries, feel free to reach out to the development team.

