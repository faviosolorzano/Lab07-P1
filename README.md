# Lab 07 - Login + CRUD + Balanceo de Carga

Laboratorio del curso **Desarrollo de Soluciones en la Nube**.

Este proyecto implementa una aplicación web con autenticación, gestión de usuarios y balanceo de carga utilizando **Node.js, Express, SQLite y Nginx**.

La aplicación puede ejecutarse en tres instancias locales diferentes para comprobar el funcionamiento del balanceo de carga mediante **Round Robin**.

---

## Funcionalidades

La aplicación incluye:

- Inicio de sesión.
- Validación de credenciales.
- Cierre de sesión.
- Dashboard.
- CRUD de usuarios.
- Registro de usuarios.
- Listado de usuarios.
- Edición de usuarios.
- Eliminación de usuarios.
- Contraseñas protegidas mediante bcrypt.
- Autenticación mediante JWT almacenado en cookie.
- Base de datos SQLite.
- Endpoint `/health` para comprobar el estado de cada servidor.
- Tres instancias de backend.
- Balanceo de carga con Nginx.
- Identificación visual de cada backend mediante colores.

---

## Tecnologías utilizadas

- Node.js
- Express.js
- EJS
- SQLite
- bcrypt
- JSON Web Token (JWT)
- cookie-parser
- Nginx
- HTML5
- CSS3

---

# Arquitectura local

El laboratorio utiliza tres instancias de la misma aplicación.

```text
                       CLIENTE
                          |
                          v
                  http://localhost
                          |
                          v
                    NGINX :80
                          |
                     Round Robin
                          |
              +-----------+-----------+
              |           |           |
              v           v           v
          Backend 1   Backend 2   Backend 3
          Puerto 8081 Puerto 8082 Puerto 8083
             Azul        Verde       Naranja
```

Nginx recibe las solicitudes mediante el puerto `80` y las distribuye entre los tres servidores.

---

# Requisitos

Antes de ejecutar el proyecto se necesita tener instalado:

- Node.js
- npm
- Git
- Nginx para Windows

Para comprobar Node.js:

```powershell
node --version
```

Para comprobar npm:

```powershell
npm --version
```

Para comprobar Git:

```powershell
git --version
```

---

# 1. Clonar el proyecto

Abrir PowerShell y ejecutar:

```powershell
git clone https://github.com/faviosolorzano/Lab07-P1.git
```

Ingresar a la carpeta:

```powershell
cd Lab07-P1
```

---

# 2. Instalar dependencias

Ejecutar:

```powershell
npm install
```

Esto instalará las dependencias definidas en `package.json`.

Entre ellas se encuentran:

```text
express
ejs
sqlite3
bcrypt
jsonwebtoken
cookie-parser
```

---

# 3. Base de datos

No es necesario crear manualmente la base de datos.

Cuando la aplicación se ejecuta por primera vez, automáticamente se crea:

```text
database/lab07.db
```

También se crea la tabla:

```text
usuarios
```

y un usuario administrador inicial.

## Credenciales iniciales

```text
Correo:
admin@tecsup.edu.pe

Contraseña:
123456
```

La contraseña es almacenada utilizando bcrypt.

---

# 4. Ejecutar una sola instancia

Para probar inicialmente la aplicación se puede ejecutar:

```powershell
npm run dev
```

o:

```powershell
node app.js
```

Por defecto se utilizará:

```text
Servidor: Backend 1
Puerto: 8081
Color: Azul
```

Abrir:

```text
http://localhost:8081
```

---

# 5. Probar el Login

Utilizar:

```text
Correo:
admin@tecsup.edu.pe

Contraseña:
123456
```

Después del inicio de sesión se mostrará el Dashboard.

---

# 6. Probar el CRUD

Desde el Dashboard seleccionar:

```text
Administrar usuarios
```

El sistema permite realizar las cuatro operaciones principales:

```text
CREATE  -> Registrar usuario

READ    -> Listar usuarios

UPDATE  -> Editar usuario

DELETE  -> Eliminar usuario
```

Para realizar una prueba se puede registrar un usuario como:

```text
Nombre:
Usuario Prueba

Correo:
usuario@correo.com

Contraseña:
123456

Rol:
Usuario
```

Después se puede editar y posteriormente eliminar.

---

# 7. Ejecutar los tres Backends

Para probar el balanceo se necesitan tres terminales PowerShell.

Todas deben estar ubicadas dentro de la carpeta del proyecto.

## Backend 1 - Azul

Terminal 1:

```powershell
$env:PORT="8081"
$env:SERVER_NAME="Backend 1"
$env:SERVER_COLOR="#2563eb"
node app.js
```

Acceso directo:

```text
http://localhost:8081
```

---

## Backend 2 - Verde

Terminal 2:

```powershell
$env:PORT="8082"
$env:SERVER_NAME="Backend 2"
$env:SERVER_COLOR="#16a34a"
node app.js
```

Acceso directo:

```text
http://localhost:8082
```

---

## Backend 3 - Naranja

Terminal 3:

```powershell
$env:PORT="8083"
$env:SERVER_NAME="Backend 3"
$env:SERVER_COLOR="#ea580c"
node app.js
```

Acceso directo:

```text
http://localhost:8083
```

---

# 8. Comprobar los servidores

Abrir individualmente:

```text
http://localhost:8081
http://localhost:8082
http://localhost:8083
```

Cada servidor debe mostrar un color diferente.

```text
Backend 1 -> Azul

Backend 2 -> Verde

Backend 3 -> Naranja
```

---

# 9. Health Check

Cada backend posee el endpoint:

```text
/health
```

Se puede comprobar utilizando:

```text
http://localhost:8081/health
http://localhost:8082/health
http://localhost:8083/health
```

Los resultados esperados son:

```text
OK - Backend 1
OK - Backend 2
OK - Backend 3
```

---

# 10. Instalar Nginx en Windows

Descargar la versión de Nginx para Windows desde su página oficial.

Descomprimir Nginx de manera que el ejecutable quede disponible, por ejemplo:

```text
C:\nginx\nginx.exe
```

La estructura aproximada será:

```text
C:\nginx
│
├── nginx.exe
├── conf
│   └── nginx.conf
├── html
└── logs
```

---

# 11. Configurar Nginx

Abrir:

```text
C:\nginx\conf\nginx.conf
```

Reemplazar su contenido por:

```nginx
worker_processes 1;

events {
    worker_connections 1024;
}

http {

    include mime.types;
    default_type application/octet-stream;

    sendfile on;

    upstream lab07_backend {

        # Nginx utiliza Round Robin por defecto.

        server 127.0.0.1:8081;
        server 127.0.0.1:8082;
        server 127.0.0.1:8083;

    }

    server {

        listen 80;

        server_name localhost;

        location / {

            proxy_pass http://lab07_backend;

            proxy_http_version 1.1;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

        }

    }

}
```

Guardar el archivo.

---

# 12. Validar la configuración de Nginx

Abrir PowerShell como administrador.

Ejecutar:

```powershell
cd C:\nginx
```

Después:

```powershell
.\nginx.exe -t
```

Si la configuración es correcta debe aparecer:

```text
syntax is ok
test is successful
```

---

# 13. Iniciar Nginx

Ejecutar:

```powershell
.\nginx.exe
```

Comprobar los procesos:

```powershell
tasklist | findstr nginx
```

Si aparecen procesos `nginx.exe`, Nginx se encuentra ejecutándose.

---

# 14. Probar el balanceo

Con los tres backends y Nginx ejecutándose, abrir:

```text
http://localhost
```

No se debe acceder directamente mediante `8081`, `8082` o `8083` durante esta prueba.

Nginx recibirá las solicitudes mediante el puerto `80` y las distribuirá entre los backends.

El cambio puede identificarse visualmente mediante:

```text
Backend 1 -> Azul

Backend 2 -> Verde

Backend 3 -> Naranja
```

---

# 15. Comprobar Round Robin desde PowerShell

Ejecutar:

```powershell
1..9 | ForEach-Object {
    curl.exe -s http://localhost/health
    Write-Host ""
}
```

Se deberían observar respuestas provenientes de los tres servidores, por ejemplo:

```text
OK - Backend 1
OK - Backend 2
OK - Backend 3
OK - Backend 1
OK - Backend 2
OK - Backend 3
OK - Backend 1
OK - Backend 2
OK - Backend 3
```

Esto permite comprobar que Nginx está distribuyendo las solicitudes entre las tres instancias.

---

# 16. Detener Nginx

Para detener Nginx correctamente:

```powershell
cd C:\nginx
```

Ejecutar:

```powershell
.\nginx.exe -s quit
```

Comprobar:

```powershell
tasklist | findstr nginx
```

Si no aparece ningún proceso, Nginx fue detenido.

---

# 17. Detener los Backends

En cada una de las tres terminales donde se está ejecutando Node.js presionar:

```text
Ctrl + C
```

---

# Estructura del proyecto

```text
Lab07-P1
│
├── database
│   ├── database.js
│   └── lab07.db
│
├── middleware
│   └── auth.js
│
├── public
│   └── css
│       └── styles.css
│
├── views
│   ├── login.ejs
│   ├── dashboard.ejs
│   ├── usuarios.ejs
│   ├── crearUsuario.ejs
│   └── editarUsuario.ejs
│
├── app.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

> `lab07.db` puede no existir inmediatamente después de clonar el repositorio si está excluido mediante `.gitignore`. Se crea automáticamente al iniciar la aplicación.

---

# Flujo general

```text
Usuario
   |
   v
LOGIN
   |
   v
JWT
   |
   v
DASHBOARD
   |
   v
CRUD USUARIOS
   |
   v
SQLite
```

Con balanceo:

```text
Usuario
   |
   v
NGINX :80
   |
   v
Round Robin
   |
   +----------+----------+
   |          |          |
   v          v          v
Backend 1  Backend 2  Backend 3
  8081       8082       8083
```

---

# Seguridad utilizada

El proyecto utiliza:

- bcrypt para proteger las contraseñas almacenadas.
- JWT para mantener la autenticación.
- Cookies HTTP Only para almacenar el token.
- Rutas protegidas mediante middleware.
- Validación de credenciales.
- Contraseñas no almacenadas directamente como texto plano en SQLite.

El uso de JWT permite que una sesión pueda ser validada por cualquiera de las instancias siempre que compartan la misma clave de firma.

---

# Evidencias recomendadas

Para demostrar el funcionamiento del laboratorio se recomienda capturar:

1. Login funcionando.
2. Validación de credenciales incorrectas.
3. Dashboard.
4. CRUD de usuarios.
5. Creación de usuario.
6. Edición de usuario.
7. Eliminación de usuario.
8. Backend 1 en puerto 8081.
9. Backend 2 en puerto 8082.
10. Backend 3 en puerto 8083.
11. Nginx ejecutándose.
12. Aplicación mediante `http://localhost`.
13. Cambio visual entre los diferentes backends.
14. Prueba `/health` mostrando la distribución entre los tres servidores.

---

## Autor

**Favio Solorzano**

Curso: Desarrollo de Soluciones en la Nube

TECSUP - 2026