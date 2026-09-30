const jwt = require("jsonwebtoken");

const JWT_SECRET = "lab07-jwt-secret-2026";

function verificarLogin(req, res, next) {

    const token = req.cookies.token;

    if (!token) {
        return res.redirect("/");
    }

    try {

        const usuario = jwt.verify(
            token,
            JWT_SECRET
        );

        req.usuario = usuario;

        next();

    } catch (error) {

        res.clearCookie("token");

        return res.redirect("/");

    }

}

module.exports = {
    verificarLogin,
    JWT_SECRET
};