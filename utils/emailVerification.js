// requiring the nodemailer package
const nodemailer = require('nodemailer');

// transporter function for connecting with the email to send messages
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "my.apps.1s9t@gmail.com",
        pass: process.env.PASS
    }
})

// function to generate the code
async function mailVerification(req, res, receiver) {
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    // generating the message
    message = {
        from: "my.apps.1s9t@gmail.com",
        to: receiver,
        subject: "Account Verification",
        text: `Your Verification Code is ${verificationCode}`
    }


    const sendMessage = async(message) =>{
        await transporter.sendMail(message, function (err, info) {
            // Sending error message in case of any error
            if (err) {return 0}
        });
    }

    await sendMessage(message);
    return verificationCode;
}

// exporting the mail verification function
module.exports = mailVerification;