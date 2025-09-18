import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

// const healthCheck = (req , res) =>{
//     try {
//         res.status(200).json(new ApiResponse(200 , {
//             message: "Server is Live!"
//         }))
//     } catch (error) {
//         console.error("Error is " , error)  
//     }
// }

const healthCheck = asyncHandler(async (req,res) =>{
    res.status(200).json(
        new ApiResponse(200 , {message:"Server is Live!"})
    )
})

export {healthCheck}

/* If you have too many controllers , then writing try-catch everywhere becomes messy.
To avoid this , we use wrapper function that automatically catches error and forwards them to express next error
next() -> a function provided by express that passes control to next middleware / route handler.
If you call this next(error) -> Express skip all remaining normal middlewares and passes control directly to error handling middleware.  */