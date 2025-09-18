import "dotenv/config"
import app from "./app.js"
import connectDB from "./db/index.js"


const port = process.env.PORT || 8000


// we only listen to port once we connect to the DataBase.
connectDB()
.then(()=>{
    app.listen(port , () =>{
    console.log(`Server is running at http://localhost:${port}`)
})
})
.catch((err)=>{
    console.error("MongoDB Connection Error" , err);
})




/* Prettier automatically format your code so that i looks clean , consistent and readable(fixes indentation automatically , removes unnecessory trailing , commas or semicolons) 
The reason to use Prettier in project is to solve ongoing debates over styles.
.prettierrc let my editor know that I am using prettier
Use .prettierignore to ignore certain files and folders completely
nodemon automatically restart the node application when file changes in the direactory are detected
we install it as development dependency
.env module is used to store enviroment variables ie. credentials , secure info . 
.env is added to .gitignore to protect secrets.
Hosting platforms like vercel also assigns configuration through enviroment variables.
So , if our app contain .env file then our app adapt that configuration easily
we use process.env to use any enviroment variable

index.js is entry point of application so we keep too short */


