import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { User } from '../user/User';
import { asyncHandler } from '../middleware/errorHandler';

export const oauthLogin = asyncHandler(async (req: Request, res: Response) => {
  const { provider, token, userData } = req.body;

  if (!provider || !token || !userData) {
    return res.status(400).json({
      success: false,
      message: 'Missing required OAuth data'
    });
  }

  // Find or create user based on OAuth provider
  let user = await User.findOne({
    $or: [
      { [`oauth.${provider}.id`]: userData.id },
      { email: userData.email }
    ]
  });

  if (!user) {
    // Create new user
    user = new User({
      username: userData.username || userData.name,
      email: userData.email,
      firstName: userData.firstName || userData.name?.split(' ')[0] || 'User',
      lastName: userData.lastName || userData.name?.split(' ')[1] || '',
      avatar: userData.avatar || userData.picture,
      oauth: {
        [provider]: {
          id: userData.id,
          token,
          email: userData.email
        }
      }
    });
    await user.save();
  } else {
    // Update existing user's OAuth info
    user.oauth = {
      ...user.oauth,
      [provider]: {
        id: userData.id,
        token,
        email: userData.email
      }
    };
    await user.save();
  }

  // Generate JWT tokens
  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  // Add refresh token to user
  (user as any).refreshTokens.push(refreshToken);
  await user.save();

  return res.json({
    success: true,
    message: 'OAuth login successful',
    data: {
      user: user.toJSON(),
      accessToken,
      refreshToken
    }
  });
});
