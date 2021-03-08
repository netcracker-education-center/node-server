const express = require("express");
const config = require('config');
const bodyParser = require('body-parser');




const app = express();

// app.use('/api/kafka', require('../routes/kafka.routes'));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:7070"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.json());


app.use('/api/kafkajs', require('../routes/kafkajs'));
app.use('/api/kafkanode', require('../routes/kafkanode'));

const PORT = config.get('port') || 7071;


app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});