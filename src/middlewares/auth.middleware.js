import { User } from "../modles/user.models.js";
import { ApiError } from "../utils/api-errors.js";
import { asyncHandler } from "../utils/async-handler.js";
import jwt from "jsonwebtoken"


export const verifyToken = asyncHandler(async (req,res,next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "")

    if(!token){
        throw new ApiError(401 , "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).
        select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry");

        if(!user){
            throw new ApiError(401 , "Invalid access Token")
        }

        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401 , "Invalid Access Token")   
    }

})

/**
 * First, middleware checks if the request contains an accessToken.
 * Then check the token’s signature against your secret key.
 * If it doesn’t match or is expired → throw 401 Unauthorized.
 * The decoded token contains the payload you signed earlier (usually { id, email, role }).
 * You assign it to req.user
 * Now, downstream controllers/handlers know who the user is.
 */

/** This is called optional chaining.
 * If req.cookies exists → return req.cookies.accessToken.
If req.cookies is undefined or null → safely return undefined or null (instead of throwing error). */