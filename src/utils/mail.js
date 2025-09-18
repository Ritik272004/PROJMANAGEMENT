import Mailgen from "mailgen";
import nodemailer from "nodemailer";


const sendEmail = async (options)=>{
    // create instance of Mailgen (define mailgen branding and theme)

    const mailGenerator = new Mailgen({
        theme : "default",
        product : {
            name : "Task Manager",
            link : "http://taskmanagerlink.com"
        }
    })

    // Generate HTML + PlainText Email

    const emailHtml = mailGenerator.generate(options.mailgenContent)
    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent)

    // create transporter(SMTP + mailtrap)

    const transporter = nodemailer.createTransport({
        host : process.env.MAILTRAP_SMTP_HOST,
        port : process.env.MAILTRAP_SMTP_PORT,
        auth:{
            user : process.env.MAILTRAP_SMTP_USER,
            pass : process.env.MAILTRAP_SMTP_PASS
        }
    })

    // send email by nodemailer

    const mail = {
        from : "mail.taskmanager@example.com",
        to : options.email,
        subject : options.subject,
        text: emailTextual,
        html : emailHtml
    }

    try {
        await transporter.sendMail(mail)
    } catch (error) {
       console.error("Email services failed silently. Make sure that you have provided your MAILTRAP credentials in the .env file")
       console.error("Error is: " , error) 
    }

}


// Defining the emails

const emailVerificationMailGenContent = (username , verificationUrl)=>{
    return {
        body : {
            name : username,
            intro : "Welcome to our App! We're very excited to have you on board.",
            action : {
                instruction : "To verify your email please click on the following button",
                button:{
                    color : "#22BC66",
                    text : "Verify your email",
                    link : verificationUrl
                }
            },
            outro : "Need help, or have questions? Just reply to this email, we'd love to help."
        }
    }
}  


const forgotPasswordMailGenContent = (username , passwordResetUrl)=>{
    return {
        body : {
            name : username,
            intro : "Welcome to our App! We're very excited to have you on board.",
            action : {
                instruction : "To reset your password please click on the following button",
                button:{
                    color : "#22BC66",
                    text : "Reset your password",
                    link : passwordResetUrl
                }
            },
            outro : "Need help, or have questions? Just reply to this email, we'd love to help."
        }
    }
} 

export {sendEmail ,emailVerificationMailGenContent , forgotPasswordMailGenContent}

/**
 * nodemailer : It just sends email.
 * Mailgen = a Node.js package that generates nice, responsive, professional-looking HTML emails with zero CSS/HTML coding.
 * 
 * for sending email we use mailtrap (modern Email Delivery for developer & product teams)
 * It send email to my gmail account , so that I can test it.
 * for production level we use AWS SES for sending email.
 * 
 * options is config object that makes you sendEmail() function reusable and customizable for different type of emails(verification email , reset password email).
 */