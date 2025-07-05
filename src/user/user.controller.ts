import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from './User';
import { IUser } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { IAuthRequest } from '../types';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
    });
  }

  // Create new user
  const user = new User({
    username,
    email,
    password,
    firstName,
    lastName
  });

  await user.save();

  // Generate tokens
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

  // Send verification email
  if (process.env.NODE_ENV === 'production') {
    await sendVerificationEmail(user.email, (user as any)._id.toString());
  }

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toJSON(),
      accessToken,
      refreshToken
    }
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last seen and online status
  (user as any).lastSeen = new Date();
  (user as any).isOnline = true;
  await user.save();

  // Generate tokens
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
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      accessToken,
      refreshToken
    }
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    const user = await User.findById(decoded.userId);

    if (!user || !(user as any).refreshTokens.includes(refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // Remove old refresh token and add new one
    (user as any).refreshTokens = (user as any).refreshTokens.filter((token: any) => token !== refreshToken);
    (user as any).refreshTokens.push(newRefreshToken);
    await user.save();

    return res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

export const logout = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  const user = req.user!;

  if (refreshToken) {
    // Remove refresh token
    (user as any).refreshTokens = (user as any).refreshTokens.filter((token: any) => token !== refreshToken);
  } else {
    // Remove all refresh tokens
    (user as any).refreshTokens = [];
  }

  user.isOnline = false;
  user.lastSeen = new Date();
  await user.save();

  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export const getProfile = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id);
  
  return res.json({
    success: true,
    data: user
  });
});

export const updateProfile = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { firstName, lastName, email, username, bio, avatar, phoneNumber, location, website, socialLinks } = req.body;
  
  const updateData: any = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (email !== undefined) updateData.email = email;
  if (username !== undefined) updateData.username = username;
  if (bio !== undefined) updateData.bio = bio;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (location !== undefined) updateData.location = location;
  if (website !== undefined) updateData.website = website;
  if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

  // Check if email or username is being updated and if it's already taken
  if (email || username) {
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(username ? [{ username }] : [])
      ],
      _id: { $ne: req.user!._id }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    updateData,
    { new: true, runValidators: true }
  );

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

export const updatePreferences = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { preferences } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { preferences },
    { new: true, runValidators: true }
  );

  return res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: user
  });
});

export const changePassword = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.user!._id).select('+password');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Invalidate all refresh tokens
  (user as any).refreshTokens = [];
  await user.save();

  return res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, search, status } = req.query;
  
  const query: any = {};
  
  if (search) {
    query.$or = [
      { username: { $regex: search as string, $options: 'i' } },
      { firstName: { $regex: search as string, $options: 'i' } },
      { lastName: { $regex: search as string, $options: 'i' } },
      { email: { $regex: search as string, $options: 'i' } }
    ];
  }
  
  if (status) {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);
  
  const users = await User.find(query)
    .select('-password -refreshTokens -twoFactorSecret')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await User.countDocuments(query);

  return res.json({
    success: true,
    data: users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId).select('-password -refreshTokens -twoFactorSecret');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  return res.json({
    success: true,
    data: user
  });
});

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.params;
  const { limit = 10 } = req.query;
  
  const users = await User.find({
    $or: [
      { username: { $regex: query, $options: 'i' } },
      { firstName: { $regex: query, $options: 'i' } },
      { lastName: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  })
  .select('-password -refreshTokens -twoFactorSecret')
  .limit(Number(limit));

  res.json({
    success: true,
    data: users
  });
});

export const updateOnlineStatus = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { status, isOnline } = req.body;
  
  const updateData: any = {};
  if (status !== undefined) updateData.status = status;
  if (isOnline !== undefined) updateData.isOnline = isOnline;
  
  if (isOnline === false) {
    updateData.lastSeen = new Date();
  }

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    updateData,
    { new: true }
  );

  return res.json({
    success: true,
    data: user
  });
});

export const deleteAccount = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { password } = req.body;
  
  const user = await User.findById(req.user!._id).select('+password');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Password is incorrect'
    });
  }

  // Delete user
  await User.findByIdAndDelete(req.user!._id);

  return res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  // Send reset email
  if (process.env.NODE_ENV === 'production') {
    await sendPasswordResetEmail(user.email, resetToken);
  }

  return res.json({
    success: true,
    message: 'Password reset email sent'
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    user.password = newPassword;
    (user as any).refreshTokens = []; // Invalidate all sessions
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }
}); 