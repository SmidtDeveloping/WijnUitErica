const mongoose = require("mongoose");

async function connect(mongoURL) {

    mongoose.connect(mongoURL, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000, 
        autoIndex: false, 

    }).then(
        console.log("Database Verbonden")
    )
    .catch(err => console.error(err));

}
module.exports = connect