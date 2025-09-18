import express from "express"
import cors from "cors"
import healthCheckRouter from "./routes/healthcheckroutes.js"
import authRouter from "./routes/auth.routes.js"
import cookieParser from "cookie-parser"

const app = express()

// basic configuration
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true , limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// cors configuration
app.use(cors({
    origin:process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials:true,
    methods:[ "GET" , "POST" ,"PUT" ,"PATCH" ,"DELETE" ,"OPTIONS"],
    allowedHeaders: [ "Content-Type" , "Authorization"],
})
)

app.use("/api/v1/healthcheck" , healthCheckRouter)
app.use("/api/v1/auth" , authRouter)




app.get("/" , (req,res)=>{
    res.send("Server is Live!")
})

export default app

/*
without cors(cross origin resource sharing) , browser blocked incoming request from frontend.
Cors help backend to connect to any other domain like frontend.
app.use(cors)
app.use -> middleware
with express.json() anybody can send json data and our app is able to parse this data
with express.urlencoded({extended:true}) our app is able to understand URL-encoded format like query string.
extended:true -> allows parsing nested arrays and objects.
express.static() is a built-in middleware in Express used to serve static files like: Images (.png, .jpg)
cookie-parser is a middleware in Express.js that helps you:
Read cookies sent by the client (from the Cookie header).
Parse them into a JavaScript object (req.cookies).
*/