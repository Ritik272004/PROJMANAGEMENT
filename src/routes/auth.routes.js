import express from "express"
import { login, registerUser , logoutUser, verifyEmail, refreshAccessToken, forgotPasswordRequest, resetForgotPassword, getCurrentUser, changeCurrentPassword, resendEmailVerification } from "../controllers/auth.controllers.js";
import { userRegisterValidator , userLoginValidator, userForgotPasswordValidator, userResetPasswordValidator, userChangeCurrentPasswordValidator } from "../validators/index.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const authRouter = express.Router();

// unsecures routes
authRouter.post("/register", userRegisterValidator() , validate , registerUser)
authRouter.post("/login" , userLoginValidator() , validate , login)
authRouter.get("/verify-email/:verificationToken" ,verifyEmail)
authRouter.post("/refresh-token" , refreshAccessToken)
authRouter.post("/forgot-password" , userForgotPasswordValidator() , validate , forgotPasswordRequest)
authRouter.post("/reset-password/:resetToken" , userResetPasswordValidator() , validate , resetForgotPassword)


// secure Routes
authRouter.post("/logout" , verifyToken , logoutUser)
authRouter.post("/current-user" , verifyToken , getCurrentUser)
authRouter.post("/change-password" , verifyToken , userChangeCurrentPasswordValidator() , validate , changeCurrentPassword)
authRouter.post("/resend-email-verification" , verifyToken , resendEmailVerification)

export default authRouter