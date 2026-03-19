# TaskFlow Pro

A full-stack SaaS productivity platform for task and project management, similar to Notion, ClickUp, and Trello.

![TaskFlow Pro](https://img.shields.io/badge/TaskFlow-Pro-indigo)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)

## Features

- **Project Management**: Create and manage multiple projects with team collaboration
- **Kanban Board**: Drag-and-drop task management with customizable columns
- **Task Management**: Create, assign, and track tasks with priorities and due dates
- **Calendar View**: Visualize tasks by due date in a monthly calendar layout
- **Team Collaboration**: Invite members, assign tasks, and add comments
- **Notifications**: Real-time notifications for task assignments and updates
- **Analytics Dashboard**: Track productivity with charts and statistics
- **Dark Mode**: Full dark mode support
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Recharts for analytics charts
- Context API for state management

### Backend
- Node.js with Express
- PostgreSQL database
- JWT authentication
- bcrypt for password hashing
- Express Validator for input validation

## Project Structure

```
taskflow-pro/
├── app/                    # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React contexts (Auth, Theme, Notifications)
│   │   ├── layouts/        # Layout components
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── App.tsx         # Main app component
│   ├── package.json
│   └── vite.config.ts
├── backend/                # Backend Node.js API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth and validation middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Main server file
│   ├── package.json
│   └── .env.example
├── database/               # Database schema and migrations
│   └── schema.sql
├── docs/                   # Documentation
│   └── DEPLOYMENT.md
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/kaavyakarthick/taskflow-pro.git
cd taskflow-pro
```

### 2. Setup Database

```bash
# Create PostgreSQL database
createdb taskflow_pro

# Run schema
psql taskflow_pro -f database/schema.sql

# Optional: Seed with sample data
psql taskflow_pro -f database/seed.sql
```

### 3. Configure Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Configure Frontend

```bash
cd ../app

# Copy environment file
cp .env.example .env

# Edit .env with your API URL
# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/

## Demo Credentials

After seeding the database:
- Email: `demo@taskflow.pro`
- Password: `password123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add member
- `DELETE /api/projects/:id/members/:userId` - Remove member

### Tasks
- `GET /api/tasks` - List tasks (with filters)
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/positions` - Update task positions (Kanban)
- `GET /api/tasks/calendar` - Get tasks for calendar
- `GET /api/tasks/statistics/overview` - Get task statistics

### Comments
- `GET /api/tasks/:taskId/comments` - List comments
- `POST /api/tasks/:taskId/comments` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Notifications
- `GET /api/notifications` - List notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

**Backend (Render)**
1. Connect GitHub repo to Render
2. Set root directory to `backend`
3. Add environment variables
4. Deploy

**Frontend (Vercel)**
1. Import GitHub repo to Vercel
2. Set framework to Vite
3. Set root directory to `app`
4. Add `VITE_API_URL` environment variable
5. Deploy

## Environment Variables

### Backend
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskflow_pro
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=your-super-secret-key
```

### Frontend
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=TaskFlow Pro
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@taskflow.pro or open an issue in the GitHub repository.

---

Built with ❤️ by the TaskFlow Pro Team
