// requiring the nodemailer package
const nodemailer = require('nodemailer');

// transporter function for connecting with the email to send messages
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "cinema.ticketing.system117@gmail.com",
        pass: process.env.PASS
    }
})

// function to generate the code
async function mailVerification(req, res, receiver) {
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    // generating the message
    message = {
        from: "cinema.ticketing.system117@gmail.com",
        to: receiver,
        subject: "Account Verification",
        text: `Your Verification Code is ${verificationCode}`
    }
    // sending the mail to the user

    console.log(verificationCode)

    await new Promise((resolve, reject) => {
        transporter.sendMail(message, function (err, info) {
            // Sending error message in case of any error    
            if (err) {
                reject(err);
            } else {
                resolve(info);
            }
        });
    });
    

    return verificationCode;
}

// exporting the mail verification function
module.exports = mailVerification;
