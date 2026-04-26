require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const Usuario = require('./src/models/usuario.model');

const data = JSON.stringify({
  nombre: 'Prueba',
  apellido: 'Usuario',
  email: 'prueba-front@example.com',
  contrasenia: 'Test1234'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/usuarios/registro',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', async () => {
    console.log('status', res.statusCode);
    console.log('body', body);
    try {
      await mongoose.connect(process.env.MONGO_URI);
      const user = await Usuario.findOne({ email: 'prueba-front@example.com' }).lean();
      console.log('db user', JSON.stringify(user, null, 2));
      process.exit(0);
    } catch (err) {
      console.error('DB ERROR', err);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('REQUEST ERROR', err);
  process.exit(1);
});

req.write(data);
req.end();
