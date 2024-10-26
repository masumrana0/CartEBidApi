/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import { jwtHelpers } from '../../../helper/jwtHelpers';
import {
  convertHashPassword,
  verifyPassword,
} from '../../../helper/passwordSecurityHelper';
import { sendMailerHelper } from '../../../helper/sendMailHelper';
// import validationResponse from '../../../shared/validationResponse';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import {
  IChangeEmail,
  IChangePassword,
  IForgetPassword,
  ILoginUser,
  ILoginUserResponse,
  IRefreshTokenResponse,
} from './auth.interface';

// passport.ts
import passport from 'passport';
// import { Strategy } from 'passport-google-oauth20';

// login user
const userLogin = async (payload: ILoginUser): Promise<ILoginUserResponse> => {
  const { email, password } = payload;

  // Check if the user exists
  const isUserExist = await User.isUserExist(email);
  if (!isUserExist) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'User does not exist. Please create a new account!',
    );
  }

  // Match the password
  if (
    isUserExist.password &&
    !(await User.isPasswordMatched(password, isUserExist.password))
  ) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Incorrect password. Please try again.',
    );
  }

  // Destructure user details
  const { _id, role, email: Email, isEmailVerified, accountType } = isUserExist;

  const user = (await User.findById(_id)) as IUser;

  // Create the accessToken payload
  const accessTokenPayload: Record<string, any> = {
    userId: _id,
    role: role,
    email: Email,
  };

  // Conditionally add accountType if role is 'customer'
  if (role === 'customer') {
    accessTokenPayload.accountType = accountType;
  }

  // Create accessToken
  const accessToken = jwtHelpers.createToken(
    accessTokenPayload,
    config.jwt.accessTokenSecret as Secret,
    config.jwt.accessTokenExpireIn as string,
  );

  // Create refreshToken payload
  const refreshTokenPayload: Record<string, any> = {
    userId: _id,
    role: role,
    email: Email,
  };

  // Conditionally add accountType if role is 'customer'
  if (role === 'customer') {
    refreshTokenPayload.accountType = accountType;
  }

  // Create refreshToken
  const refreshToken = jwtHelpers.createToken(
    refreshTokenPayload,
    config.jwt.refreshTokenSecret as Secret,
    config.jwt.refreshTokenExpireIn as string,
  );

  const finalData = {
    token: {
      accessToken,
      refreshToken,
      isEmailVerified,
    },
    user: user,
  };

  return finalData;
};

// is user exist
const isUserExist = async (payload: { email: string }): Promise<any> => {
  const { email } = payload;

  // Check if the user exists
  const isUserExist = await User.isUserExist(email);
  if (!isUserExist) {
    return { isUserExist: false };
  } else if (isUserExist) {
    return { isUserExist: true };
  }
};

// refresh Token
const getNewAccessToken = async (
  token: string,
): Promise<IRefreshTokenResponse> => {
  //verify token
  // invalid token - synchronous
  let verifiedToken = null;
  try {
    verifiedToken = jwtHelpers.verifyToken(
      token,
      config.jwt.refreshTokenSecret as Secret,
    );
  } catch (err) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Invalid Refresh Token');
  }

  const { email: Email } = verifiedToken;

  // tumi delete hye gso  kintu tumar refresh token ase
  // checking deleted user's refresh token

  const isUserExist = await User.isUserExist(Email);
  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }
  //generate new token

  const newAccessToken = jwtHelpers.createToken(
    {
      userId: isUserExist._id,
      role: isUserExist.role,
      email: isUserExist.email,
    },
    config.jwt.accessTokenSecret as Secret,
    config.jwt.accessTokenExpireIn as string,
  );

  return {
    accessToken: newAccessToken,
  };
};

// Change Password
const changePassword = async (
  user: JwtPayload | null,
  payload: IChangePassword,
): Promise<any> => {
  const { oldPassword, newPassword } = payload;

  // Find the user by ID and include the password field
  const isUserExist = await User.isUserExist(user?.email);

  if (!isUserExist) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Sorry.User does not exist');
  }

  // Check if the old password matches
  const isCorrectPassword = await verifyPassword(
    oldPassword,
    isUserExist.password,
  );

  if (!isCorrectPassword) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'your old password is incorrect.Please try again',
    );
  }

  const hashedNewPassword = await convertHashPassword(newPassword);

  // Update the user's password
  await User.findByIdAndUpdate(isUserExist?._id, {
    password: hashedNewPassword,
  });
};

// Change email
const changeEmail = async (
  user: JwtPayload | null,
  payload: IChangeEmail,
): Promise<ILoginUserResponse> => {
  const { email, password } = payload;
  // Fetch the user by email and include the password field
  const existingUser = await User.isUserExist(user?.email);
  if (!existingUser) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User does not exist');
  }

  if (user?.email === email) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'This email address is already in use. Please enter a different email.',
    );
  }

  const isEmailExisted = await User.isUserExist(payload?.email);

  if (isEmailExisted) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'This email address is already in use. Please enter a different email.',
    );
  }

  // Verify if the provided password matches the existing user's password
  const isPasswordValid = await verifyPassword(
    password,
    existingUser?.password,
  );

  if (!isPasswordValid) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Incorrect password. Please try again.',
    );
  }

  // Update the user's email and reset the email verification status
  const updatedUser = await User.findByIdAndUpdate(
    { _id: existingUser?._id },
    { email: email, isEmailVerified: false },
    { new: true },
  );

  if (!updatedUser) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to update email. Please try again later.',
    );
  }

  const response = await AuthService.userLogin({
    email: updatedUser?.email,
    password: password,
  });

  // Send verification email to the new email address
  await sendVerificationEmail({
    name: updatedUser?.name,
    email: updatedUser?.email,
  });

  return response;
};

// send verification email
const sendVerificationEmail = async (payload: {
  email: string;
  name?: string;
}): Promise<void> => {
  const { email, name } = payload;
  const isUserExist = await User.isUserExist(email);

  // checking if user exists
  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'This user does not exist.');
  }

  const currentYear = new Date().getFullYear();

  const passVerificationToken = jwtHelpers.createResetToken(
    { userId: isUserExist?._id, email: isUserExist?.email },
    config.jwt.tokenSecret as string,
    '5m',
  );

  const verificationBaseUrl = config.verify_user_url;

  const mailInfo = {
    to: email,
    subject: 'Secure Your Account: Verify Your Account',
    html: `
    <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verify Your Email Address</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; padding-bottom: 20px;">
            <img src="https://example.com/logo.png" alt="Logo" style="width: 100px;">
        </div>
        <div style="text-align: left; line-height: 1.6;">
            <h2>Verify Your Email Address</h2>
            <p>Hi ${name || 'there'},</p>
            <p>Thank you for signing up. To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${verificationBaseUrl}/${passVerificationToken}" style="display: block; width: 200px; margin: 20px auto; padding: 10px; background-color: #007bff; color: #ffffff; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email
            </a>
            <p>Thank you,</p>
            <p>The FreeFexiPlan Team</p>
        </div>
        <div style="text-align: center; padding-top: 20px; font-size: 12px; color: #777777;">
            <p>&copy; ${currentYear} FreeFexiPlan. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `,
  };

  // console.log(mailInfo);
  await sendMailerHelper.sendMail(mailInfo);
};

// Reset Password
const verifyEmail = async (token: string) => {
  // Verify the token
  const isVerified = jwtHelpers.verifyToken(
    token,
    config.jwt.tokenSecret as string,
  );

  if (!isVerified) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Invalid  or expired Link!. Please try again',
    );
  }

  const { userId, email } = isVerified;
  const isUserExist = await User.isUserExist(email);
  if (!isUserExist) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Sorry something is wrong. Please try again',
    );
  }

  if (isUserExist?.isEmailVerified) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'your email is already verified',
    );
  }
  // Update the user's password
  await User.findByIdAndUpdate({ _id: userId }, { isEmailVerified: true });
};

// ForgetPassword
const forgetPassword = async (payload: IForgetPassword) => {
  const { email } = payload;
  const isUserExist = await User.findOne({ email: email });

  // checking is user existed
  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'this user does not exist.');
  }

  const passResetToken = await jwtHelpers.createResetToken(
    {
      userId: isUserExist?._id,
      email: isUserExist?.email,
      password: isUserExist?.password,
      role: isUserExist?.role,
    },
    config.jwt.tokenSecret as string,
    '5m',
  );

  const resetPasswordLink = `${config.reset_password_url}${passResetToken}`;

  const mailInfo = {
    to: email,
    subject: 'Secure Your Account: Reset Your Password Now',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Verification</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f5f5f5;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #ffffff;
                  border-radius: 5px;
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              .header {
                  background-color: #007bff;
                  color: #ffffff;
                  text-align: center;
                  padding: 20px 0;
                  border-top-left-radius: 5px;
                  border-top-right-radius: 5px;
              }
              .content {
                  padding: 40px;
                  color: #333333;
                  font-size: 16px;
                  line-height: 1.6;
              }
              .button {
                  display: block;
                  width: 100%;
                  max-width: 200px;
                  margin: 20px auto;
                  padding: 12px 24px;
                  background-color: #007bff;
                  color: #ffffff;
                  text-decoration: none;
                  text-align: center;
                  border-radius: 5px;
                  font-weight: bold;
              }
              .footer {
                  margin-top: 20px;
                  text-align: center;
                  font-size: 14px;
                  color: #666666;
                  padding: 20px;
                  border-bottom-left-radius: 5px;
                  border-bottom-right-radius: 5px;
                  background-color: #f0f0f0;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h2>Password Reset Verification</h2>
              </div>
              <div class="content">
                  <p>Dear,</p>
                  <p>We have received a request to reset the password for your account. To proceed with the password reset, click the button below:</p>
                  <a href="${resetPasswordLink}" class="button">Reset Password</a>
                  <p>If you did not request this password reset, please ignore this message.</p>
              </div>
              <div class="footer">
                  <p>Best regards, Freeflexiplan</p>
              </div>
          </div>
      </body>
      </html>
    `,
  };

  await sendMailerHelper.sendMail(mailInfo);
};

// Reset Password
const resetPassword = async (
  payload: { newPassword: string },
  token: string,
) => {
  const { newPassword } = payload;

  // Verify the token
  const isVerified = await jwtHelpers.verifyToken(
    token,
    config.jwt.tokenSecret as string,
  );

  if (!isVerified) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Invalid or expired link. Please try reseting your password again.',
    );
  }

  const isUserExist = await User.isUserExist(isVerified?.email);
  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'user does not exist');
  }

  const isMatchPreviousPassword = await verifyPassword(
    newPassword,
    isUserExist.password,
  );

  if (isMatchPreviousPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Please choose a different password.',
    );
  }

  const { userId } = isVerified;

  // Hash the new password
  const hashedPassword = await convertHashPassword(newPassword);

  // Update the user's password
  await User.findByIdAndUpdate({ _id: userId }, { password: hashedPassword });
};

// Login with Google
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: config.google.client_id as string,
//       clientSecret: config.google.client_secret as string,
//       callbackURL: config.google.callback_url as string,
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         // Check if the user already exists

//         let user = await User.isUserExist(profile.emails?.[0].value as string);

//         if (!user) {
//           // If the user doesn't exist, create a new user
//           user = await User.create({
//             name: profile.displayName,
//             email: profile.emails?.[0].value,
//             role: 'customer',
//             accountType: 'personal', // or default value
//             isEmailVerified: true, // Since Google email is verified by default
//             password: '', // No password for Google login
//           });
//         }

//         done(null, user);
//       } catch (error) {
//         done(error, null);
//       }
//     },
//   ),
// );

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export const AuthService = {
  userLogin,
  isUserExist,
  changeEmail,
  getNewAccessToken,
  changePassword,
  verifyEmail,
  sendVerificationEmail,
  resetPassword,
  forgetPassword,
};
