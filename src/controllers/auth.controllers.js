import { User } from "../modles/user.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-errors.js";
import { asyncHandler } from "../utils/async-handler.js";
import {emailVerificationMailGenContent, forgotPasswordMailGenContent, sendEmail} from "../utils/mail.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) =>{
    try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave : false})

    return {accessToken , refreshToken}
    } catch (error) {
        throw new ApiError(500 , "Something went wrong while generating access token")
    }
}


const registerUser = asyncHandler(async (req,res) => { // signup karna
    const {email , username , password , role } = req.body;

    const existedUser = await User.findOne({
        $or : [{username} , {email}]
    })

    if(existedUser){
        throw new ApiError(409 , "User with email or username already exists" , [])
    }

    const user = await User.create({
        email , 
        password , 
        username , 
        isEmailVerified: false
    })

    const { unHashedToken , hashedToken , tokenExpiry } = user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken

    user.emailVerificationExpiry = tokenExpiry

    await user.save({validateBeforeSave : false})

    await sendEmail({
        email: user?.email,
        subject : "Please verify your email",
        mailgenContent : emailVerificationMailGenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}` // Now here we learn how to generate dynamic route.
        )
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")

    if(!createdUser){
        throw new ApiError(500 ,
            "Something went wrong while registering a user"
        )
    }

    res.status(201).json(new ApiResponse(200 , {user : createdUser} , "user register successfully and verification email has been sent on your email"))

})

const login = asyncHandler( async (req,res) => { // signIn karna
    const {email , password} = req.body;

    if(!email){
        throw new ApiError(400 , "email is required")
    }

    const user = await User.findOne({email});

    if(!user){
        throw new ApiError(400 , "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(400 , "Invalid credentials")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")

    const options = {
        httpOnly : true, // cann't be accessed by JS on Frontend , Only the server can read/write it (sent automatically in HTTP requests).
        secure : true // only https.
    }

    return res.status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(new ApiResponse(
        200,
        {
            user : loggedInUser,
            accessToken, 
            refreshToken
        },
        "User logged in successfully"
    ))
}) 

const logoutUser = asyncHandler(async (req,res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:""
            }
        },
        {
            new : true
        }
    )
    const options = {
        httpOnly :true,
        secure : true
    }

    return res.status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(
        new ApiResponse(200 , {} , "User logged out")
    )

})

const getCurrentUser = asyncHandler( async (req,res) => {
    return res.status(200)
    .json(new ApiResponse (200 , req.user , "Current User Fetched Successfully"))
})

const verifyEmail = asyncHandler( async (req,res) => {
    const {verificationToken} = req.params

    if(!verificationToken){
        throw new ApiError(400 , "Email verification Token is missing")
    }

    let hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex")

    const user = await User.findOne({
        emailVerificationToken:hashedToken,
        emailVerificationExpiry:{$gt : Date.now()}
    })

    if(!user){
        throw new ApiError(400 , "Token is invalid or expired")
    }

    user.emailVerificationToken = undefined
    user.emailVerificationExpiry = undefined
    
    user.isEmailVerified = true;

    await user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200 , {
        isEmailVerified : true} , "Email is verified"
    ))

})


// If user loginIn without email verification (that allow some app) , user cannot use some features(like payment , invites) 
// To verify email , user can use resendEmailVerification route

const resendEmailVerification = asyncHandler(async (req,res)=>{
    const user = await User.findById(req.user._id);

    if(!user){
        throw new ApiError(404 , "User does not exist")
    }

    if(user.isEmailVerified){
        throw new ApiError(404 , "Email is already verified")
    }

    const {unHashedToken , hashedToken , tokenExpiry} = user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({validateBeforeSave : false});

    await sendEmail({
        email: user?.email,
        subject : "Please verify your email",
        mailgenContent : emailVerificationMailGenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}` // Now here we learn how to generate dynamic route.
        )
    });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Mail has been sent to your email ID"
        )
    )
})

// Create refresh access token route through which we can generate new access token if it is expired.

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401 , "Unauthorized access")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);

    if(!user){
        throw new ApiError(401 , "Invalid Refresh Token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401 , "Refresh Token is Expired")
    }

    const options = {
        httpOnly : true,
        secure:true
    }

    const {accessToken , refreshToken : newRefreshToken} = await generateAccessAndRefreshTokens(user._id);

    user.refreshToken = newRefreshToken;
    await user.save()

    return res.status(200)
    .cookie("accessToken", accessToken , options)
    .cookie("refreshToken" , newRefreshToken , options)
    .json(new ApiResponse(200 , {accessToken : accessToken , refreshToken : newRefreshToken} , "Access Token Refreshed"))
    } catch (error) {
        throw new ApiError(400 , "Invalid Refresh Token")
    }

})

// Create Forgot Password Request

const forgotPasswordRequest = asyncHandler(async (req,res) => {
    const {email} = req.body;

    const user = await User.findOne({email});

    if(!user){
        throw new ApiError(404 , "User does not exist" ,[])
    }

    const {unHashedToken , hashedToken , tokenExpiry} = user.generateTemporaryToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;

    await user.save({validateBeforeSave : false})

    await sendEmail({
        email : user?.email,
        subject:"Password reset request",
        mailgenContent : forgotPasswordMailGenContent(
            user.username ,
            `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
        )
    })

    return res.status(200)
    .json(new ApiResponse(200,
        {} ,
        "Password reset mail has been sent to your mail"
    ))
})

// Create reset password controller

const resetForgotPassword = asyncHandler(async (req,res) => {
    const {resetToken} = req.params;
    const {newPassword} = req.body;

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    const user = await User.findOne({
        forgotPasswordToken : hashedToken ,
        forgotPasswordExpiry : {$gt : Date.now()}
    })

    if(!user){
        throw new ApiError(489 , "Token is invalid or expired")
    }

    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    user.password = newPassword;
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(new ApiResponse(200,
        {} ,
        "Password reset successfully"
    ))
})

// Create change password controller (user is loggedIn)

const changeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldPassword , newPassword} = req.body;

    const user = await User.findById(req.user._id);

    const isPasswordValid = user.isPasswordCorrect(oldPassword);

    if(!isPasswordValid){
        throw new ApiError(489 , "Invalid Old Password")
    }

    user.password = newPassword;

    await user.save({validateBeforeSave:false});

    return res
    .status(200)
    .json(new ApiResponse(200,
        {},
        "Password changed Successfully"
    ))
})
export {registerUser , login , logoutUser , getCurrentUser , verifyEmail , resendEmailVerification , refreshAccessToken , forgotPasswordRequest , resetForgotPassword , changeCurrentPassword};

/** Steps for Logout Controller:
 * Get the user ID from req.user (already populated by your AuthMiddleware.js after token verification).
Remove the refreshToken from the database (So the user cannot request new access tokens)).
Clear cookies (both accessToken and refreshToken).
Send response → "User logged out successfully".

new: true → return the updated document after the update is applied.
 */

/**
 * Flow of Email Verification:
 * User signs up.
 * You generate a temporary verification token: 
 * unHashedToken → sent to the user in the email link.
 * hashedToken + expiryDate → saved in DB.
 * User gets an email
 * User clicks the link → request hits /verify-email/:token.
 * Steps inside controller: 
 * Get the token from req.params.token.
 * Hash it
 * Find a user in DB with that hashed token and check expiry.
 * If found → set isEmailVerified = true, clear token fields, save.
 */