import {body} from "express-validator"

const userRegisterValidator = () => {
    return [
        body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email is invalid"),
        body("username")
        .trim()
        .notEmpty()
        .withMessage("Username is required")
        .isLowercase()
        .withMessage("username must be in lower case")
        .isLength({ min : 3})
        .withMessage("Username must be atleast 3 characters long"),
        body("password")
        .trim()
        .notEmpty()
        .withMessage("Password is required"),
        body("fullname")
        .optional()
        .trim()      
    ]
}


const userLoginValidator = () => {
    return [
       body("email")
       .optional()
       .isEmail()
       .withMessage("Email is invalid"),
       body("password")
       .notEmpty()
       .withMessage("Password is required") 
    ]
}

const userChangeCurrentPasswordValidator = () => {
    return [
        body("oldPassword")
        .notEmpty()
        .withMessage("Old Password is required"),
        body("newPasssword")
        .notEmpty()
        .withMessage("New Password is required")
    ]
}

const userForgotPasswordValidator = () => {
    return [
        body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email is invalid")
    ]
}

const userResetPasswordValidator = () => {
    return [
        body("newPassword")
        .notEmpty()
        .withMessage("New Password is Required")
    ]
}

export {userRegisterValidator 
    , userLoginValidator
    ,userChangeCurrentPasswordValidator
    ,userForgotPasswordValidator
    ,userResetPasswordValidator
} 