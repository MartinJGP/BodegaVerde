const http = require('http');

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  try {
    console.log('Testing GET /mesas ...');
    const resMesas = await request('/mesas');
    console.log('GET /mesas ->', resMesas.status, resMesas.body);

    console.log('Testing POST /auth/register ...');
    const resReg = await request('/auth/register', 'POST', {
      nombre: "Admin Prueba",
      email: "admin@test.com",
      password: "password123",
      rol: "ADMIN"
    });
    console.log('POST /auth/register ->', resReg.status, resReg.body);
    
    console.log('Testing GET /platos ...');
    const resPlatos = await request('/platos');
    console.log('GET /platos ->', resPlatos.status, resPlatos.body);
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

// Wait a bit to ensure server is up
setTimeout(runTests, 2000);
