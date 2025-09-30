const mongoose = require("mongoose");

async function connect(mongoURL) {

    await mongoose.connect(mongoURL, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000, 
        bufferCommands: false, 
        autoIndex: false, 

    }).then(
        console.log("Database Verbonden")
    )
    .catch(err => console.error(err));

}
module.exports = connect