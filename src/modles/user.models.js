import mongoose , {Schema} from "mongoose";
import bcrypt from "bcrypt"
import crypto from "crypto"
import jwt from "jsonwebtoken"

const userSchema = new Schema(
    {
    
        avatar : {
            type : {
                url : String,
                localPath : String
            },
            default : {
                url : `https://placehold.co/200x200`
            }
        },

        username : {
            type : String, 
            required : true, 
            unique : true,
            lowercase : true,
            trim : true ,
            index : true,
        },
        email : {
            type : String ,
            required : true,
            unique : true ,
            lowercase : true ,
            trim : true,
        },

        fullName : {
            type : String ,
            trim : true
        },
        password : {
            type : String ,
            required : [true , "Password is required"] // Here we configure error , if user cannot enter password then it display warning Password is required.
        },

        isEmailVerified: {
            type : Boolean,
            default : false
        },
        refreshToken: {
            type : String
        },
        forgotPasswordToken : {
            type : String
        },
        forgotPasswordExpiry : {
            type: Date
        },
        emailVerificationToken : {
            type: String
        },
        emailVerificationExpiry: { 
            type: Date
        }
    } , {
        timestamps:true
    } 
)

// To Save new user to Database we use : create() is a shortcut static method that does both steps internally: new User(...) + .save().

// By deafult mongoose add an _id property to your schema . You can also disabled this property by simply : _id : false
// Populating a field = replacing a reference (like foreign key/ObjectId) with the actual document data from the referenced collection.
// We pass { validateBeforeSave: false } while saving the refresh token to avoid unnecessary schema validations 
// (like rechecking username/email/password) and just quickly update the token.

// Hooks in mongoose : Middleware  function that mongoose let you attach to a schema method.
// They allow you to run custom logic before (pre hooks) and after (Post Hooks) certain Mongoose events such as : save , remove , find , findAndUpdate
// We use Pre hook for hashing(It is one way process only encryption no decryption) the password.
// In this we take input (password) and produces fixed length hash value(a string of random looking characters)
// "ritik123" → $2a$10$w5pY… (bcrypt hash)
// we use bcrypt to encrypt the password.
// Bcrypt is password hashing library that makes storing and verifying passwords secure by using salts and slow hashing.





// Hashing the password using bcrypt
userSchema.pre("save" , async function(next){
    if(!this.isModified("password")) return next(); // only hash if password is changed.

   this.password = await bcrypt.hash(this.password , 10); // here 10 is saltrounds../
    next();
})

// while login with plain password what happens : 
// Bcrypt takes the stored hash (which contains the salt).
// It applies the same hashing process to the input password with that salt.
// If the result matches, login is successful ✅.

userSchema.methods.isPasswordCorrect = async function(password){ // here password is input password.
    // this function return true or false
    return await bcrypt.compare(password , this.password)
};

// What is Authentication and Authorization?
/*
Authentication : The process verifying identity.
 eg: Login Page -> you enter email + password
    System check DB -> "Yes, this is Ritik." ✅
    If wrong → "Invalid credentials." ❌

Authorization : The process of verifying what action/resources the authenticated user can access.
Usually based on roles or permission

eg: Ritik logs in successfully (authenticated).
Now: As a user, he can view his profile.
*/

// Once the user is loginIn , each subsequent request contain JWT.

/**
 * JWT -> Json Web Token(It is String format token used for authentication)
 * eg: xxxx.yyyy.zzzz (It has 3 parts)
 * header.payload.signature
 * 1. Header : The header typically consists of two parts: the type of the token, which is JWT, and the signing algorithm being used, such as SHA256.
 * 2. Payload : Payload contains claims. Claims are statements about an entity (typically, the user) and additional data. 
 * 3. Signature : To create the signature part you have to take the encoded header, the encoded payload, a secret, the algorithm specified in the header, and sign that.
 * The user agent should send JWt token , typically in the Authorization header using the Bearer schema. 
 * Authorization: Bearer <token>
 * JWT tokens are Stateless it cann't store into Database.
 * How JWT Works in Authentication
 * 1.User logs in with username + password
 * 2.Server validates credentials(Server Lookup into DataBase and verify email and match password)
 * 3.Server create JWT with user info + expiry
 * 4.Server send JWT to client.
 * 5.client store JWT into (localStorage , cookie)
 * 6.On each request , client send JWT (Usually in authorization header)
 * 7.Now server don't lookup into DataBase , it simply verify signature -> if valid , user is authenticated.
**/
/**
 * Actually JWT is Token with Data . It is of Two types-:
 * 1. Access Token -> A short-lived Token(expiry can be 15 min , 1hr , or exaggerated to 1 day)
 * Proves the user is authenticated.
 * Sent with every request (usually in Authorization: Bearer <token> header).
 * Contains user info (id, role, expiry).   
 * 2. Refresh Token -> A long-lived Token (expiry can be 10 days , or exaggerated to 1 month)
 * Not sent with every request
 * Store securely in client side and DataBase also.
 * Used only when access token expires
 * Its job : ask the server for a new access token.
 */
/** Mechanism: How They Work Together 
 * User logs in with email + password.
 * Server validates credentials.
 * Server issues : Access Token (short expiry, e.g. 15m) , Refresh Token (long expiry, e.g. 7d).
 * Client sends Access Token in headers.
 * Server checks validity & processes request.
 * When Access Token expires , server responds: 401 Unauthorized (Token Expired).
 * Client then sends Refresh Token to server (usually via a /refresh endpoint).
 * Server validates Refresh Token : If valid → issues a new Access Token
 * If invalid/expired → user must log in again.
 */

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        // payload
        {
            _id : this._id,
            email:this.email,
            username:this.username
        },
        // secret
        process.env.ACCESS_TOKEN_SECRET,
        // expiry
        {expiresIn : process.env.ACCESS_TOKEN_EXPIRY}
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        // Define Payload
        {
            _id : this._id
        },
        // define secret
        process.env.REFRESH_TOKEN_SECRET,
        // Define expiry
        {expiresIn : process.env.REFRESH_TOKEN_EXPIRY}
    )
}

// To generate Token without Data(random unique string) we use crypto model of node.js
// We prefer Token with Data , because in this no database lookup is needed.
// Token without Data is Temporary Token used for verifying the user and to reset the password.

userSchema.methods.generateTemporaryToken = function(){
    const unHashedToken = crypto.randomBytes(20).toString("hex");

    const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex")

    const tokenExpiry = Date.now() + (20*60*1000) // 20 mints

    return {unHashedToken , hashedToken , tokenExpiry}

}


 // Cryptography is the science of securing data so that only the right people can read or change it.
 // Digital Signature = A digital signature is like an electronic seal/stamp that proves two things:
                        // ✅ The data really came from the sender (Authenticity).
                        // ✅ The data wasn’t changed in between (Integrity).
// It’s built using cryptography (public key + private key).

export const User = mongoose.model("User" , userSchema);
  
// when this User model goes to mongoDB , it automatically converted to LowerCase and User will be coverted to users plural form.

/*
In models folder , we define the structure of data that we want to store in DataBase
Firstly we define Schema , after we create model using that schema.
And at last this model is used to store new data , update data and access data from DataBase.
*/