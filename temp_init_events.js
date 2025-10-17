import fetch from 'node-fetch';

const url = 'http://localhost:8787/api/eventos/init';

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dummy-token'
  }
};

console.log('Sending request:', JSON.stringify(options, null, 2));

fetch(url, options)
  .then(async res => {
    console.log('Received response:');
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log('Headers:', JSON.stringify(res.headers.raw(), null, 2));
    const text = await res.text();
    console.log('Body:', text);
  })
  .catch(err => console.error('Error:', err));