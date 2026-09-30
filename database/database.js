const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "lab07.db");

const db = new sqlite3.Database(dbPath, (error) => {
    if (error) {
        console.error("Error al conectar con SQLite:", error.message);
    } else {
        console.log("Base de datos SQLite conectada.");
    }
});

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            rol TEXT NOT NULL DEFAULT 'Usuario'
        )
    `);

    // Creo el administrador únicamente si todavía no existe.
    db.get(
        "SELECT * FROM usuarios WHERE email = ?",
        ["admin@tecsup.edu.pe"],
        async (error, usuario) => {

            if (error) {
                console.error(error.message);
                return;
            }

            if (!usuario) {

                const passwordHash = await bcrypt.hash("123456", 10);

                db.run(
                    `
                    INSERT INTO usuarios
                    (nombre, email, password, rol)
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        "Administrador",
                        "admin@tecsup.edu.pe",
                        passwordHash,
                        "Administrador"
                    ],
                    (error) => {

                        if (error) {
                            console.error(
                                "Error creando administrador:",
                                error.message
                            );
                        } else {
                            console.log(
                                "Usuario administrador creado."
                            );
                        }

                    }
                );

            }

        }
    );

});

module.exports = db;
