# Chat App API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### Register User
- **POST** `/auth/register`
- **Description**: Register a new user account
- **Body**:
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```

### Login
- **POST** `/auth/login`
- **Description**: Authenticate user and get tokens
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

### Refresh Token
- **POST** `/auth/refresh-token`
- **Description**: Get new access token using refresh token
- **Body**:
  ```json
  {
    "refreshToken": "refresh-token"
  }
  ```

### Logout
- **POST** `/auth/logout`
- **Description**: Logout user and invalidate tokens
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "refreshToken": "refresh-token"
  }
  ```

---

## User Management Endpoints

### Get User Profile
- **GET** `/users/profile`
- **Description**: Get current user's profile
- **Headers**: Authorization required

### Update Profile
- **PUT** `/users/profile`
- **Description**: Update user profile
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Software Developer",
    "avatar": "https://example.com/avatar.jpg",
    "phoneNumber": "+1234567890",
    "location": "New York",
    "website": "https://johndoe.com",
    "socialLinks": {
      "twitter": "https://twitter.com/johndoe",
      "linkedin": "https://linkedin.com/in/johndoe",
      "github": "https://github.com/johndoe"
    }
  }
  ```

### Update Preferences
- **PUT** `/users/preferences`
- **Description**: Update user preferences
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "preferences": {
      "theme": "dark",
      "language": "en",
      "notifications": {
        "messages": true,
        "calls": true,
        "mentions": true,
        "groupUpdates": true
      },
      "privacy": {
        "showStatus": true,
        "showLastSeen": true,
        "allowReadReceipts": true
      }
    }
  }
  ```

### Change Password
- **PUT** `/users/change-password`
- **Description**: Change user password
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "currentPassword": "oldpassword",
    "newPassword": "newpassword123"
  }
  ```

### Get All Users
- **GET** `/users`
- **Description**: Get all users (for chat creation)
- **Headers**: Authorization required
- **Query Parameters**:
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 50)
  - `search` (string): Search query
  - `status` (string): Filter by status

### Search Users
- **GET** `/users/search/:query`
- **Description**: Search users by name, email, or username
- **Headers**: Authorization required
- **Query Parameters**:
  - `limit` (number): Maximum results (default: 10)

### Get User by ID
- **GET** `/users/:userId`
- **Description**: Get specific user details
- **Headers**: Authorization required

### Update Online Status
- **PUT** `/users/online-status`
- **Description**: Update user's online status
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "status": "online",
    "isOnline": true
  }
  ```

### Delete Account
- **DELETE** `/users/account`
- **Description**: Delete user account
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "password": "currentpassword"
  }
  ```

### Forgot Password
- **POST** `/users/forgot-password`
- **Description**: Send password reset email
- **Body**:
  ```json
  {
    "email": "john@example.com"
  }
  ```

### Reset Password
- **POST** `/users/reset-password`
- **Description**: Reset password using token
- **Body**:
  ```json
  {
    "token": "reset-token",
    "newPassword": "newpassword123"
  }
  ```

---

## Chat Management Endpoints

### Create Chat
- **POST** `/chats`
- **Description**: Create a new chat (direct or group)
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "type": "direct",
    "participants": ["user-id-1", "user-id-2"],
    "name": "Group Name",
    "description": "Group description"
  }
  ```

### Get Chats
- **GET** `/chats`
- **Description**: Get all chats for current user
- **Headers**: Authorization required
- **Query Parameters**:
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 20)
  - `type` (string): Filter by chat type (direct/group)
  - `search` (string): Search in chat names/descriptions

### Get Chat
- **GET** `/chats/:chatId`
- **Description**: Get specific chat details
- **Headers**: Authorization required

### Update Chat
- **PUT** `/chats/:chatId`
- **Description**: Update chat information
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "name": "Updated Group Name",
    "description": "Updated description",
    "avatar": "https://example.com/avatar.jpg"
  }
  ```

### Delete Chat
- **DELETE** `/chats/:chatId`
- **Description**: Delete a chat (admin only)
- **Headers**: Authorization required

### Add Participant
- **POST** `/chats/:chatId/participants`
- **Description**: Add user to chat
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "userId": "user-id-to-add"
  }
  ```

### Remove Participant
- **DELETE** `/chats/:chatId/participants/:userId`
- **Description**: Remove user from chat
- **Headers**: Authorization required

### Add Admin
- **POST** `/chats/:chatId/admins`
- **Description**: Make user admin of chat
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "userId": "user-id-to-promote"
  }
  ```

### Remove Admin
- **DELETE** `/chats/:chatId/admins/:userId`
- **Description**: Remove admin privileges
- **Headers**: Authorization required

### Toggle Mute
- **PUT** `/chats/:chatId/mute`
- **Description**: Toggle chat mute for current user
- **Headers**: Authorization required

### Toggle Pin
- **PUT** `/chats/:chatId/pin`
- **Description**: Toggle chat pin for current user
- **Headers**: Authorization required

### Generate Invite Link
- **POST** `/chats/:chatId/invite`
- **Description**: Generate invite link for chat
- **Headers**: Authorization required

### Join by Invite
- **POST** `/chats/join/:inviteToken`
- **Description**: Join chat using invite link
- **Headers**: Authorization required

---

## Message Management Endpoints

### Send Message
- **POST** `/messages`
- **Description**: Send a new message
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "chatId": "chat-id",
    "content": "Hello, world!",
    "type": "text",
    "replyTo": "message-id",
    "mediaUrl": "https://example.com/file.jpg",
    "mediaType": "image/jpeg",
    "mediaSize": 1024000,
    "mediaDuration": 30,
    "fileName": "document.pdf",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "New York, NY"
    }
  }
  ```

### Get Messages
- **GET** `/messages/:chatId`
- **Description**: Get messages for a chat
- **Headers**: Authorization required
- **Query Parameters**:
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 50)
  - `before` (date): Get messages before this date
  - `after` (date): Get messages after this date

### Edit Message
- **PUT** `/messages/:messageId`
- **Description**: Edit a message (within 15 minutes)
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "content": "Updated message content"
  }
  ```

### Delete Message
- **DELETE** `/messages/:messageId`
- **Description**: Delete a message (sender or admin)
- **Headers**: Authorization required

### React to Message
- **POST** `/messages/:messageId/reactions`
- **Description**: Add reaction to message
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "emoji": "👍"
  }
  ```

### Remove Reaction
- **DELETE** `/messages/:messageId/reactions`
- **Description**: Remove reaction from message
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "emoji": "👍"
  }
  ```

### Pin Message
- **POST** `/messages/:messageId/pin`
- **Description**: Pin a message
- **Headers**: Authorization required

### Unpin Message
- **DELETE** `/messages/:messageId/pin`
- **Description**: Unpin a message
- **Headers**: Authorization required

### Forward Message
- **POST** `/messages/:messageId/forward`
- **Description**: Forward message to other chats
- **Headers**: Authorization required
- **Body**:
  ```json
  {
    "chatIds": ["chat-id-1", "chat-id-2"]
  }
  ```

### Mark as Seen
- **POST** `/messages/:messageId/seen`
- **Description**: Mark message as seen
- **Headers**: Authorization required

### Search Messages
- **GET** `/messages/search/:query`
- **Description**: Search messages
- **Headers**: Authorization required
- **Query Parameters**:
  - `chatId` (string): Search in specific chat
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 20)

---

## File Upload Endpoints

### Upload Image
- **POST** `/upload/image`
- **Description**: Upload an image file
- **Headers**: Authorization required
- **Body**: FormData with 'image' field

### Upload Video
- **POST** `/upload/video`
- **Description**: Upload a video file
- **Headers**: Authorization required
- **Body**: FormData with 'video' field

### Upload Audio
- **POST** `/upload/audio`
- **Description**: Upload an audio file
- **Headers**: Authorization required
- **Body**: FormData with 'audio' field

### Upload File
- **POST** `/upload/file`
- **Description**: Upload any file type
- **Headers**: Authorization required
- **Body**: FormData with 'file' field

### Delete File
- **DELETE** `/upload/:publicId`
- **Description**: Delete uploaded file
- **Headers**: Authorization required

### Search GIFs
- **GET** `/upload/giphy`
- **Description**: Search GIFs using GIPHY API
- **Headers**: Authorization required
- **Query Parameters**:
  - `query` (string): Search term
  - `limit` (number): Number of results (default: 20)
  - `offset` (number): Offset for pagination (default: 0)

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## Success Responses

All endpoints return consistent success responses:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Environment Variables

Required environment variables:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/chat-app

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# CORS
CORS_ORIGIN=http://localhost:3000

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# GIPHY (for GIF search)
GIPHY_API_KEY=your-giphy-api-key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Socket.IO Events

The server also supports real-time communication via Socket.IO:

### Connection Events
- `user:connect` - User connects
- `user:disconnect` - User disconnects

### Message Events
- `message:send` - Send message
- `message:received` - Message received
- `message:delivered` - Message delivered
- `message:seen` - Message seen
- `message:edit` - Message edited
- `message:delete` - Message deleted
- `message:react` - Message reaction
- `message:forward` - Message forwarded

### Typing Events
- `typing:start` - User starts typing
- `typing:stop` - User stops typing

### Call Events
- `call:incoming` - Incoming call
- `call:answer` - Call answered
- `call:reject` - Call rejected
- `call:end` - Call ended
- `call:signal` - Call signaling

### Presence Events
- `presence:update` - User status update

### Notification Events
- `notification:new` - New notification 