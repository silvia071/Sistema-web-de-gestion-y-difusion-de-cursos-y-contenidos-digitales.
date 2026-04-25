# Backend - Proyecto Final

## Descripción del Sistema

Esta es la **API REST** del backend para una plataforma web de gestión y difusión de cursos y contenidos digitales. El sistema permite:

### Funcionalidades Principales
- **Gestión de Usuarios**: Registro, autenticación y perfiles de usuarios
- **Administración de Cursos**: Crear, editar y gestionar cursos en línea
- **Carrito de Compras**: Sistema de compras integrado
- **Pagos con Mercado Pago**: Procesamiento de pagos seguros
- **Sistema de Lecciones**: Contenido multimedia organizado
- **Mensajes de Contacto**: Comunicación con administradores
- **Autenticación JWT**: Seguridad basada en tokens
- **Panel Administrativo**: Gestión completa del sistema

### Arquitectura
- **Backend**: Node.js + Express.js
- **Base de Datos**: MongoDB (local o Atlas)
- **Autenticación**: JWT (JSON Web Tokens)
- **Pagos**: Mercado Pago API
- **Arquitectura**: RESTful API con MVC

## Requisitos del Sistema

### Requisitos Mínimos
- **Node.js**: versión 16 o superior
- **npm**: versión 7 o superior
- **MongoDB**: versión 4.4 o superior (local o Atlas)
- **Sistema Operativo**: Windows 10+, macOS 10.15+, Linux Ubuntu 18.04+

### Requisitos Recomendados
- **Node.js**: versión 18 LTS
- **npm**: versión 9+
- **MongoDB Atlas**: Para despliegue en la nube
- **RAM**: 4GB mínimo
- **Espacio en Disco**: 500MB para el proyecto + base de datos

## Tecnologías Utilizadas

### Core
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web para Node.js
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB

### Seguridad y Autenticación
- **JWT** - JSON Web Tokens para autenticación
- **bcryptjs** - Hashing de contraseñas
- **CORS** - Control de acceso cross-origin

### Pagos y APIs Externas
- **Mercado Pago SDK** - Integración de pagos
- **Axios** - Cliente HTTP para APIs

### Desarrollo
- **Nodemon** - Reinicio automático del servidor
- **Dotenv** - Gestión de variables de entorno

## Instalación y Configuración

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/tu-repositorio.git
cd proyecto-final/backend
```

### Paso 2: Instalar Dependencias
```bash
npm install
```

### Paso 3: Configurar Base de Datos

#### MongoDB Atlas (Recomendado)
1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. Obtén la connection string

### Paso 4: Configurar Mercado Pago
1. Crea una cuenta en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
2. Crea una aplicación
3. Obtén el `access_token` y `public_key`

### Paso 5: Configurar Variables de Entorno
Crea el archivo `.env` como se describe en la sección "Crear archivo .env"

### Paso 6: Iniciar el Servidor

#### Modo Desarrollo (con Nodemon)
```bash
npm run dev
```

#### Modo Producción
```bash
npm start
```

El servidor se iniciará en `http://localhost:3000` por defecto.

### Verificar Instalación
Una vez iniciado el servidor, puedes verificar que todo funciona correctamente:

1. **Health Check**: Visita `http://localhost:3000/api/health` (si tienes este endpoint)
2. **Conexión a BD**: El servidor debería mostrar "Conectado a MongoDB" en la consola
3. **API Documentation**: Si tienes Swagger/Postman, prueba los endpoints básicos


## Configuración Inicial

### Crear archivo `.env`
Para que la aplicación funcione correctamente, debes crear un archivo `.env` en la raíz de la carpeta `backend/` con las siguientes variables de entorno:

```bash
# Archivo: .env (ubicado en: backend/.env)

# Base de datos MongoDB
MONGO_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/proyectoFinal

# Puerto del servidor
PORT=3000

# JWT (JSON Web Token)
JWT_SECRET=tu_clave_secreta_muy_segura

# URL del frontend
FRONTEND_URL=http://localhost:5173

# Node Environment
NODE_ENV=development
```

### Pasos para configurar:

1. **Duplica el archivo de ejemplo** (si existe `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. **O crea el archivo manualmente**:
   - En la raíz de la carpeta `backend/`
   - Nombre del archivo: `.env`
   - Llena las variables con tus valores

3. **Variables requeridas**:
   - **MONGO_URI**: Conexión a MongoDB (local o Atlas)
     - Formato: `mongodb+srv://usuario:contraseña@cluster.mongodb.net/nombreBD`
     - O local: `mongodb://localhost:27017/proyectoFinal`
   - **PORT**: Puerto del servidor (3000 en tu caso)
   - **JWT_SECRET**: Clave segura para firmar tokens


4. **Para obtener credenciales**:
   - **MongoDB Atlas**: Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - **Mercado Pago**: Obtén tus credenciales para vender tus cursos en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)

5. **Instala dependencias**:
   ```bash
   npm install
   ```

6. **Inicia el servidor**:
   ```bash
   npm start
   ```
   O con nodemon (desarrollo):
   ```bash
   npm run dev
   ```

### Importante:

⚠️ **Nunca commits el archivo `.env` al repositorio**. Debe estar en `.gitignore`:

```gitignore
.env
.env.local
node_modules/
```

---

## Estructura del Proyecto

```
backend/
├── src/
│   ├── app.js                    # Configuración principal de Express
│   ├── server.js                 # Punto de entrada del servidor
│   ├── config/
│   │   ├── database.js           # Configuración de MongoDB
│   │   └── mercadopago.js        # Configuración de Mercado Pago
│   ├── controllers/              # Controladores de la API
│   │   ├── usuario.controller.js
│   │   ├── curso.controller.js
│   │   ├── compra.controller.js
│   │   └── ...
│   ├── models/                   # Modelos de datos (Mongoose)
│   │   ├── usuario.model.js
│   │   ├── curso.model.js
│   │   ├── compra.model.js
│   │   └── ...
│   ├── routes/                   # Definición de rutas
│   │   ├── usuario.route.js
│   │   ├── curso.route.js
│   │   └── ...
│   ├── services/                 # Lógica de negocio
│   │   ├── usuario.service.js
│   │   ├── pago.service.js
│   │   └── ...
│   ├── middlewares/              # Middlewares personalizados
│   │   ├── verificarToken.middleware.js
│   │   ├── verificarAdmin.middleware.js
│   │   └── ...
│   ├── enums/                    # Enumeraciones
│   │   ├── estadoCompra.js
│   │   ├── rolUsuario.js
│   │   └── ...
│   └── utils/                    # Utilidades (opcional)
├── node_modules/                 # Dependencias instaladas
├── .env                          # Variables de entorno (no versionado)
├── .env.example                  # Ejemplo de variables de entorno
├── package.json                  # Dependencias y scripts
├── nodemon.json                  # Configuración de Nodemon
├── .gitignore                    # Archivos ignorados por Git
└── README.md                     # Esta documentación
```

## Scripts Disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor con Nodemon (desarrollo)
- `npm test` - Ejecuta los tests (si están configurados)
- `npm run lint` - Ejecuta ESLint (si está configurado)

## Despliegue en Producción

### Variables de Entorno para Producción
```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/proyectoFinal
JWT_SECRET=clave_muy_segura_para_produccion
PORT=3000
FRONTEND_URL=https://tu-dominio.com
```

### Servicios de Hosting Recomendados
- **Backend**: Railway, Render, Heroku, DigitalOcean App Platform
- **Base de Datos**: MongoDB Atlas
- **Archivos**: Cloudinary, AWS S3 (para imágenes/videos de cursos)

### Checklist de Despliegue
- [ ] Variables de entorno configuradas
- [ ] Base de datos conectada
- [ ] Credenciales de Mercado Pago válidas
- [ ] CORS configurado para el dominio del frontend
- [ ] HTTPS habilitado
- [ ] Logs configurados
- [ ] Backup de base de datos programado

## Desarrollo y Testing

### Ejecutar Tests
```bash
npm test
```


### Debugging
- Usa `console.log()` para debugging básico
- Configura logs con Winston para producción
- Revisa los logs de MongoDB Atlas para consultas lentas

## Contribución

### Flujo de Trabajo
1. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Realiza tus cambios siguiendo las mejores prácticas
3. Ejecuta tests y linting: `npm run lint && npm test`
4. Crea un commit descriptivo
5. Push a tu rama y crea un Pull Request

### Estándares de Código
- Usa ESLint para mantener consistencia
- Documenta funciones y endpoints importantes
- Sigue el patrón MVC establecido
- Usa nombres descriptivos en inglés

### Reportar Issues
Si encuentras bugs o tienes sugerencias:
1. Revisa si ya existe un issue similar
2. Crea un nuevo issue con descripción detallada
3. Incluye pasos para reproducir el problema
4. Agrega logs o screenshots si es relevante


## Troubleshooting

### "Error: connect ECONNREFUSED"
- Verifica que MongoDB está corriendo (local o tiene acceso a Atlas)
- Confirma la URI de conexión en `.env`

### "Error: Invalid connection string"
- Verifica el formato de MONGO_URI
- Comprueba usuario y contraseña si usas MongoDB Atlas
- Revisa que el cluster esté activo en MongoDB Atlas

### "Error: JWT_SECRET is not defined"
- Asegúrate de que el archivo `.env` existe en la carpeta `backend/`
- Verifica que la variable `JWT_SECRET` está configurada

### "Error: MERCADO_PAGO_ACCESS_TOKEN not found"
- Obtén tu token en Mercado Pago Developers
- Configúralo en el archivo `.env`
