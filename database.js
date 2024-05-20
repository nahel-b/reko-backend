const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;


async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connecté à MongoDB Atlas');
        db = client.db();
    } catch (error) {
        console.error('Erreur de connexion à MongoDB Atlas', error);
    }
}

function getDB() {
    return db;
}

module.exports = { connectToDatabase, getDB };
