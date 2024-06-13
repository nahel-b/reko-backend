const bcrypt = require('bcrypt');
const { getDB } = require('./database');
const jwt = require('jsonwebtoken');
const { platform } = require('os');


async function signup(req, res, next) {
    try {
        const db = getDB();
        const usersCollection = db.collection('utilisateur');

        // Vérifie si l'email existe déjà
        const existingEmail = await usersCollection.findOne({ email: req.body.email.toLowerCase() });
        if (existingEmail) {
            return res.status(409).json({ message: "Email already exists" });
        }

        const existingUsername = await usersCollection.findOne({ username: req.body.username.toLowerCase() });
        if (existingUsername) {
            return res.status(409).json({ message: "Username already exists" });
        }

        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(req.body.password, 12);

        // Création de l'utilisateur
        const newUser = {
            email: req.body.email.toLowerCase(),
            username: req.body.username.toLowerCase(),
            surname: req.body.surname.toLowerCase(),
            name: req.body.name.toLowerCase(),
            password: hashedPassword,
            authLevel: 0,
            current_platform: "none",

        };
        if (!newUser.email || !newUser.name || !newUser.password || !newUser.surname || !newUser.username) {
            return res.status(400).json({ message: "Missing fields" });
        }
        console.log("[APP][New user] : ", newUser.username," " ,newUser.email," - " ,newUser.name," ", newUser.surname,);

        await usersCollection.insertOne(newUser);
        res.status(200).json({ message: "User created" });
    } catch (error) {
        console.error("Error while creating user:", error);
        res.status(500).json({ message: "Error while creating user" });
    }
}

async function login(req, res, next) {
    try {
        const db = getDB();
        const usersCollection = db.collection('utilisateur');
        // Vérifie si l'email existe
        const dbUser = await usersCollection.findOne({ username: req.body.username.toLowerCase() });
        if (!dbUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Compare les mots de passe
        const compareRes = await bcrypt.compare(req.body.password, dbUser.password);
        if (compareRes) {
            // Crée un token JWT
            //recuperer les informations de l'utilisateur
            
            const token = jwt.sign({ username: req.body.username.toLowerCase() }, process.env.JWT_SECRET, { expiresIn: '7d' });
            res.status(200).json({ message: "User logged in", token: token });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Error while logging in:", error);
        res.status(500).json({ message: "Error while logging in" });
    }
}

const authMiddleware = async (req, res, next) => {
    const authHeader = req.get("Authorization");

    if (!authHeader) {
        return res.status(401).json({ message: 'No authorization header provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        if (!decodedToken) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // Vérifier si le token est sur le point d'expirer (par exemple, dans les 5 minutes)
        const expirationTime = decodedToken.exp * 1000; // Convertir en millisecondes
        const now = Date.now();
        const timeDifference = expirationTime - now;

        // Si le token est sur le point d'expirer, générer un nouveau token
        if (timeDifference < 300000) { // 5 minutes en millisecondes
            const newToken = jwt.sign({ username: decodedToken.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

            // Envoyer le nouveau token dans l'en-tête de réponse
            res.setHeader('Authorization', `Bearer ${newToken}`);
        }

        // Ajouter les informations de l'utilisateur au req
        req.user = decodedToken;
        // console.log("User authenticated : ", req.user);
        next(); // Passez à la prochaine fonction de middleware ou route
    } catch (error) {
        //console.error("Error while verifying token:", error);
        return res.status(500).json({ message: 'Error while verifying token' });
    }
};

async function deleteAccount(req, res, next) {
    console.log("User to delete : ", req.user);
    try {
        const db = getDB();
        const usersCollection = db.collection('utilisateur');
        
        const result = await usersCollection.deleteOne({ username: req.user.username });
        if (result.deletedCount === 1) {
            res.status(200).json({ message: "User deleted" });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Error while deleting user:", error);
        res.status(500).json({ message: "Error while deleting user" });
    }
}

module.exports = { signup,login, authMiddleware,deleteAccount };
