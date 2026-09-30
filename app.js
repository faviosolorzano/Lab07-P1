const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const db = require("./database/database");

const {
    verificarLogin,
    JWT_SECRET
} = require("./middleware/auth");

const app = express();


// ======================================================
// CONFIGURACIÓN DEL BACKEND
// ======================================================

const PORT =
    process.env.PORT || 8081;

const SERVER_NAME =
    process.env.SERVER_NAME || "Backend 1";

const SERVER_COLOR =
    process.env.SERVER_COLOR || "#2563eb";


// ======================================================
// EXPRESS
// ======================================================

app.set("view engine", "ejs");

app.set(
    "views",
    path.join(__dirname, "views")
);

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.use(cookieParser());


// ======================================================
// VARIABLES PARA TODAS LAS VISTAS
// ======================================================

app.use((req, res, next) => {

    res.locals.servidor =
        SERVER_NAME;

    res.locals.color =
        SERVER_COLOR;

    res.locals.puerto =
        PORT;

    next();

});


// ======================================================
// LOGIN
// ======================================================

app.get("/", (req, res) => {

    const token =
        req.cookies.token;

    if (token) {

        try {

            jwt.verify(
                token,
                JWT_SECRET
            );

            return res.redirect(
                "/dashboard"
            );

        } catch (error) {

            res.clearCookie(
                "token"
            );

        }

    }

    res.render("login", {
        error: null
    });

});


// ======================================================
// VALIDAR LOGIN
// ======================================================

app.post("/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    db.get(
        "SELECT * FROM usuarios WHERE email = ?",
        [email],
        async (error, usuario) => {

            if (error) {

                console.error(error);

                return res.render(
                    "login",
                    {
                        error:
                            "Ocurrió un error al iniciar sesión"
                    }
                );

            }

            if (!usuario) {

                return res.render(
                    "login",
                    {
                        error:
                            "Correo o contraseña incorrectos"
                    }
                );

            }

            const passwordCorrecta =
                await bcrypt.compare(
                    password,
                    usuario.password
                );

            if (!passwordCorrecta) {

                return res.render(
                    "login",
                    {
                        error:
                            "Correo o contraseña incorrectos"
                    }
                );

            }

            const token =
                jwt.sign(
                    {
                        id: usuario.id,
                        nombre:
                            usuario.nombre,
                        email:
                            usuario.email,
                        rol:
                            usuario.rol
                    },
                    JWT_SECRET,
                    {
                        expiresIn: "2h"
                    }
                );

            res.cookie(
                "token",
                token,
                {
                    httpOnly: true,
                    sameSite: "lax"
                }
            );

            return res.redirect(
                "/dashboard"
            );

        }
    );

});


// ======================================================
// DASHBOARD
// ======================================================

app.get(
    "/dashboard",
    verificarLogin,
    (req, res) => {

        db.get(
            `
            SELECT COUNT(*) AS total
            FROM usuarios
            `,
            [],
            (error, resultado) => {

                const totalUsuarios =
                    resultado
                        ? resultado.total
                        : 0;

                res.render(
                    "dashboard",
                    {
                        usuario:
                            req.usuario,
                        totalUsuarios
                    }
                );

            }
        );

    }
);


// ======================================================
// LISTAR USUARIOS
// ======================================================

app.get(
    "/usuarios",
    verificarLogin,
    (req, res) => {

        db.all(
            `
            SELECT id,
                   nombre,
                   email,
                   rol
            FROM usuarios
            ORDER BY id DESC
            `,
            [],
            (error, usuarios) => {

                if (error) {

                    console.error(
                        error
                    );

                    return res.send(
                        "Error al obtener usuarios"
                    );

                }

                res.render(
                    "usuarios",
                    {
                        usuario:
                            req.usuario,
                        usuarios
                    }
                );

            }
        );

    }
);


// ======================================================
// FORMULARIO CREAR USUARIO
// ======================================================

app.get(
    "/usuarios/nuevo",
    verificarLogin,
    (req, res) => {

        res.render(
            "crearUsuario",
            {
                usuario:
                    req.usuario,
                error: null
            }
        );

    }
);


// ======================================================
// GUARDAR USUARIO
// ======================================================

app.post(
    "/usuarios/nuevo",
    verificarLogin,
    async (req, res) => {

        const {
            nombre,
            email,
            password,
            rol
        } = req.body;

        try {

            const passwordHash =
                await bcrypt.hash(
                    password,
                    10
                );

            db.run(
                `
                INSERT INTO usuarios
                (
                    nombre,
                    email,
                    password,
                    rol
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    nombre,
                    email,
                    passwordHash,
                    rol
                ],
                function (error) {

                    if (error) {

                        let mensaje =
                            "No se pudo registrar el usuario";

                        if (
                            error.message.includes(
                                "UNIQUE"
                            )
                        ) {

                            mensaje =
                                "El correo ya está registrado";

                        }

                        return res.render(
                            "crearUsuario",
                            {
                                usuario:
                                    req.usuario,
                                error:
                                    mensaje
                            }
                        );

                    }

                    res.redirect(
                        "/usuarios"
                    );

                }
            );

        } catch (error) {

            console.error(error);

            res.send(
                "Error al registrar usuario"
            );

        }

    }
);


// ======================================================
// FORMULARIO EDITAR
// ======================================================

app.get(
    "/usuarios/editar/:id",
    verificarLogin,
    (req, res) => {

        const id =
            req.params.id;

        db.get(
            `
            SELECT id,
                   nombre,
                   email,
                   rol
            FROM usuarios
            WHERE id = ?
            `,
            [id],
            (error, usuarioEditar) => {

                if (
                    error ||
                    !usuarioEditar
                ) {

                    return res.redirect(
                        "/usuarios"
                    );

                }

                res.render(
                    "editarUsuario",
                    {
                        usuario:
                            req.usuario,
                        usuarioEditar,
                        error: null
                    }
                );

            }
        );

    }
);


// ======================================================
// ACTUALIZAR USUARIO
// ======================================================

app.post(
    "/usuarios/editar/:id",
    verificarLogin,
    (req, res) => {

        const id =
            req.params.id;

        const {
            nombre,
            email,
            rol
        } = req.body;

        db.run(
            `
            UPDATE usuarios
            SET nombre = ?,
                email = ?,
                rol = ?
            WHERE id = ?
            `,
            [
                nombre,
                email,
                rol,
                id
            ],
            (error) => {

                if (error) {

                    return res.send(
                        "No se pudo actualizar el usuario"
                    );

                }

                res.redirect(
                    "/usuarios"
                );

            }
        );

    }
);


// ======================================================
// ELIMINAR USUARIO
// ======================================================

app.post(
    "/usuarios/eliminar/:id",
    verificarLogin,
    (req, res) => {

        const id =
            req.params.id;

        // Evito eliminar el usuario con el que
        // actualmente tengo iniciada la sesión.
        if (
            Number(id) ===
            Number(req.usuario.id)
        ) {

            return res.redirect(
                "/usuarios"
            );

        }

        db.run(
            `
            DELETE FROM usuarios
            WHERE id = ?
            `,
            [id],
            (error) => {

                if (error) {

                    console.error(
                        error
                    );

                }

                res.redirect(
                    "/usuarios"
                );

            }
        );

    }
);


// ======================================================
// LOGOUT
// ======================================================

app.get(
    "/logout",
    (req, res) => {

        res.clearCookie(
            "token"
        );

        res.redirect("/");

    }
);


// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
    "/health",
    (req, res) => {

        res.status(200).send(
            `OK - ${SERVER_NAME}`
        );

    }
);


// ======================================================
// INICIAR SERVIDOR
// ======================================================

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "=========================================="
        );

        console.log(
            "      LAB 07 - LOGIN + CRUD"
        );

        console.log(
            "=========================================="
        );

        console.log(
            `Servidor : ${SERVER_NAME}`
        );

        console.log(
            `Puerto   : ${PORT}`
        );

        console.log(
            `Color    : ${SERVER_COLOR}`
        );

        console.log(
            `URL      : http://localhost:${PORT}`
        );

        console.log(
            "=========================================="
        );

        console.log("");

    }
);