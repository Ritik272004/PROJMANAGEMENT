import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-errors.js";



export const validate = (req,res,next)=>{
    const errors = validationResult(req); // this method return array
    if(errors.isEmpty()){
        return next();
    }
    const extractedErrors = [];
    errors.array().map((err)=> extractedErrors.push(
        {
            [err.path] : err.msg,
        }
    ))
    throw new ApiError(422 , "Recieved data is not valid" , extractedErrors);
}








/*
Use . when you know the property name in advance and it's a valid identifier.
Use [] when the property is dynamic, stored in a variable, or not a valid identifier (like "fav color").
*/























/**
 * for validation(it can be any email validation , password validation etc) we use zod ,express-validator.
 */