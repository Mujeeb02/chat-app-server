# Chat App Server - Modular Architecture

## Overview
This is a modular Node.js/Express server for a real-time chat application built with TypeScript, MongoDB, and Socket.IO.

## Project Structure

```
server/
├── src/
│   ├── modules/           # Modular architecture
│   │   ├── user/         # User management module
│   │   │   ├── user.model.ts
│   │   │   ├── user.controller.ts
│   │   │   └── user.routes.ts
│   │   ├── chat/         # Chat management module
│   │   │   ├── chat.model.ts
│   │   │   ├── chat.controller.ts
│   │   │   └── chat.routes.ts
│   │   ├── message/      # Message management module
│   │   │   ├── message.model.ts
│   │   │   ├── message.controller.ts
│   │   │   └── message.routes.ts
│   │   ├── upload/       # File upload module
│   │   │   ├── upload.controller.ts
│   │   │   └── upload.routes.ts
│   │   └── index.ts      # Module router
│   ├── middleware/       # Middleware functions
│   ├── services/         # Business logic services
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Main server file
├── package.json
└── README.md
```

## Features

### User Management
- User registration and authentication
- Profile management
- Password reset functionality
- User search and discovery
- Online status tracking
- User preferences and settings

### Chat Management
- Direct and group chat creation
- Participant management
- Admin controls
- Chat settings and permissions
- Invite links for group chats
- Chat archiving and pinning

### Message Management
- Text, media, and location messages
- Message reactions and replies
- Message editing and deletion
- Message forwarding
- Read receipts and delivery status
- Message search functionality

### File Upload
- Image, video, and audio uploads
- File management
- GIF search integration
- Cloudinary integration for media storage

### Real-time Features
- Socket.IO integration
- Real-time messaging
- Typing indicators
- Online presence
- Push notifications

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/search/:query` - Search users
- `GET /api/users/:userId` - Get user by ID

### Chats
- `POST /api/chats` - Create chat
- `GET /api/chats` - Get user's chats
- `GET /api/chats/:chatId` - Get specific chat
- `PUT /api/chats/:chatId` - Update chat
- `DELETE /api/chats/:chatId` - Delete chat
- `POST /api/chats/:chatId/participants` - Add participant
- `DELETE /api/chats/:chatId/participants/:userId` - Remove participant

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/:chatId` - Get chat messages
- `PUT /api/messages/:messageId` - Edit message
- `DELETE /api/messages/:messageId` - Delete message
- `POST /api/messages/:messageId/reactions` - Add reaction
- `DELETE /api/messages/:messageId/reactions` - Remove reaction

### Upload
- `POST /api/upload/image` - Upload image
- `POST /api/upload/video` - Upload video
- `POST /api/upload/audio` - Upload audio
- `POST /api/upload/file` - Upload file
- `GET /api/upload/giphy` - Search GIFs

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure the following environment variables:
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
GIPHY_API_KEY=your-giphy-api-key
```

4. Start the development server:
```bash
npm run dev
```

## Development

### Building the project:
```bash
npm run build
```

### Running tests:
```bash
npm test
```

### Linting:
```bash
npm run lint
npm run lint:fix
```

## Database Models

### User Model
- Basic user information (name, email, username)
- Authentication data (password, tokens)
- Profile information (bio, avatar, social links)
- Preferences and settings
- Online status and last seen
- OAuth provider data

### Chat Model
- Chat type (direct/group)
- Participants and admins
- Chat settings and permissions
- Last message reference
- Unread counts and mute status
- Pinned messages

### Message Model
- Message content and type
- Sender and chat references
- Media attachments
- Reactions and replies
- Read receipts and delivery status
- Message metadata (edited, deleted, pinned)

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet security headers
- File upload restrictions

## Performance Features

- Database indexing
- Pagination for large datasets
- Compression middleware
- Efficient queries with population
- File upload optimization
- Real-time communication optimization

## Contributing

1. Follow the modular architecture pattern
2. Add proper validation and error handling
3. Include TypeScript types for all new features
4. Write tests for new functionality
5. Update documentation for new endpoints

## License

MIT License 