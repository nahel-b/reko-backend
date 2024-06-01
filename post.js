const { getDB } = require('./database');

async function createPost(req, res) {
    try {
        const db = getDB();
        const postsCollection = db.collection('posts');

        const newPost = {
            album: req.body.album,
            artiste: req.body.artiste,
            user: req.user.email, // L'utilisateur est récupéré à partir du token décodé
            time: req.body.time,
            duration: req.body.duration,
            id_spotify: req.body.id_spotify,
            image_urls: req.body.image_urls,
            popularity: req.body.popularity,
            preview_url: req.body.preview_url,
            titre: req.body.titre,
            id: req.body.id
        };

        // Vérifiez si tous les champs obligatoires sont présents
        if (!newPost.album || !newPost.artiste || !newPost.user || !newPost.time ||
            !newPost.duration || !newPost.id_spotify || !newPost.image_urls || !newPost.popularity ||
            !newPost.preview_url || !newPost.titre || !newPost.id) {
            return res.status(400).json({ message: "Missing fields" });
        }

        await postsCollection.insertOne(newPost);
        res.status(200).json({ message: "Post created successfully" });
    } catch (error) {
        console.error("Error while creating post:", error);
        res.status(500).json({ message: "Error while creating post" });
    }
}
module.exports = { createPost };
