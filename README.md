# Collaborative Presentations

A professional, real-time collaborative presentation web application built with Next.js, Express, and Socket.io. Create, edit, and present slides together with your team in real-time.

## ✨ Features

### Core Functionality
- **Real-time Collaboration**: Multiple users can edit presentations simultaneously with WebSocket support
- **No Registration Required**: Simple nickname-based authentication
- **Drag & Drop Interface**: Intuitive slide editing with draggable text blocks
- **Markdown Support**: Rich text formatting with markdown syntax
- **Present Mode**: Full-screen presentation view
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

### User Management
- **Role-based Access Control**: Creator, Editor, and Viewer permissions
- **User Access Management**: Add/remove users with specific roles
- **Public Presentations**: Optional public access for wider collaboration
- **Anonymous Editing**: Allow anonymous users to edit public presentations

### Technical Features
- **WebSocket Integration**: Real-time updates across all connected clients
- **Persistent Storage**: MongoDB database for data persistence
- **Professional UI**: Business-ready appearance with Tailwind CSS
- **Responsive Design**: Optimized for all screen sizes

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-6
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/presentations
   NODE_ENV=development
   PORT=3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS 3** - Utility-first CSS framework
- **Socket.io Client** - Real-time communication
- **React Draggable** - Drag and drop functionality
- **Marked & DOMPurify** - Markdown parsing and sanitization

### Backend
- **Express.js 5** - Web application framework
- **Socket.io** - Real-time bidirectional communication
- **Mongoose** - MongoDB object modeling
- **MongoDB** - NoSQL database

## 📁 Project Structure

```
task-6/
├── app/                          # Next.js App Router
│   ├── components/              # React components
│   │   ├── CreatePresentationModal.js
│   │   ├── DraggableWrapper.js
│   │   ├── MarkdownTextBlock.js
│   │   ├── NicknameModal.js
│   │   ├── PresentationCard.js
│   │   ├── SlidePanel.js
│   │   ├── TextBlock.js
│   │   └── UserAccessManager.js
│   ├── hooks/                   # Custom React hooks
│   │   ├── usePresentation.js
│   │   └── useSocket.js
│   ├── presentation/[id]/       # Dynamic presentation routes
│   ├── globals.css             # Global styles
│   ├── layout.js               # Root layout
│   └── page.js                 # Home page
├── controllers/                 # Express controllers
│   └── presentationController.js
├── models/                      # Mongoose models
│   └── presentation.js
├── routes/                      # Express routes
│   └── presentations.js
├── public/                      # Static assets
├── server.js                    # Express server with Socket.io
└── package.json
```

## 🎯 Usage

### Creating a Presentation
1. Enter your nickname (no registration required)
2. Click "Create New Presentation"
3. Fill in title and description
4. Start adding slides and content

### Collaborating
1. Share the presentation URL with team members
2. Team members enter their nicknames to join
3. Edit slides in real-time together
4. Use the right-click context menu to add text blocks

### Managing Access
- **Creators** can manage users, add/remove slides, and edit content
- **Editors** can edit slide content but cannot manage slides or users
- **Viewers** have read-only access

### Presenting
- Click the "Present" button for full-screen mode
- Navigate slides with arrow keys or on-screen controls
- Exit with Escape key

## 🔧 Scripts

```bash
# Development
npm run dev          # Start development server with nodemon

# Production
npm run build        # Build for production
npm start           # Start production server

# Linting
npm run lint        # Run ESLint
```

## 🌐 Deployment

### Render Deployment
1. Connect your GitHub repository to Render
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Add environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-connection-string>
   PORT=10000
   ```

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

**MongoDB connection issues**
- Ensure MongoDB is running locally or check cloud connection string
- Verify network connectivity and credentials

**Styling not loading**
- Clear browser cache
- Restart development server
- Check Tailwind CSS configuration

## 🔮 Future Enhancements

- [ ] PDF export functionality
- [ ] Image upload and embedding
- [ ] Slide templates
- [ ] Presentation themes
- [ ] Undo/Redo functionality
- [ ] Slide animations and transitions
- [ ] Voice/video chat integration
- [ ] Presentation analytics
