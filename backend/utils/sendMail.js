import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);
const sendMail = async (options) => {

    // const transporter = nodemailer.createTransport({
    //     service: process.env.SMTP_SERVICE,
    //     host: process.env.SMTP_HOST,
    //     port: process.env.SMTP_PORT,

    //     secure: false,
    //     // secure: false,
    //     auth: {
    //         user: process.env.SMTP_MAIL,      // sender email address
    //         pass: process.env.SMTP_PASSWORD,   // app password from email account
    //     },
    // });


    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASS
        }
    })
    const { email, subject, template, data } = options;

    // get the path to the email template file
    const templatePath = path.join(__dirname, '../mails', template)

    const html = await ejs.renderFile(templatePath, data)

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html,
    }

    // console.log(mailOptions)

    await transporter.sendMail(mailOptions)

}

export default sendMail;

