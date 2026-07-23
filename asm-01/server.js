const express = require('express')


const app=express()
const PORT = 3000

// Middleware to parse JSON bodies in incoming requests
app.use(express.json());

// Serve Swagger UI at /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//Stage 0: Basic server setup
app.get('/', (req, res)=>{res.send('Hello, server!');});

app.listen(PORT, () => {
    console.log(`Server running on: ${PORT}`);
});

