require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 7000,
    MONGO_URL: "mongodb+srv://sarwanhaider_db_user:DJQQSXyDziXvjB8x@cluster0.5jrgpai.mongodb.net/sequence?retryWrites=true&w=majority&appName=Cluster0",
    corsOptions: {
        origin: '*', 
        methods: ["GET", "POST", "OPTIONS"]
    }
};
