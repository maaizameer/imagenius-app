import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import knex from "knex";
import bcrypt from "bcrypt-nodejs";

const database = knex({
        client: 'pg',
        connection: {
        host : '127.0.0.1',
        port : 5432,
        user : 'postgres',
        password: 'test',
        database : 'postgres'
    }
  });

const app = express();
app.use(bodyParser.json());
app.use(cors());


app.get('/', (req, res)=>{
    res.send('success')
});

app.post('/signin', (req, res) =>{
    database.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        if(isValid){
            return database.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => res.status(400).json('Error finding user'))
        }else{
            res.status(400).json('error finding user');
        }
    })
    .catch(err => res.status(400).json('Error finding user'))
});

app.post('/register', (req, res)=> {
    const { name, email, password } = req.body;
    const hash = bcrypt.hashSync(password)
        database.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email
            })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                .returning('*')
                .insert({
                    email: loginEmail[0].email,
                    name: name,
                    joined: new Date()
                })
                .then(user => res.json(user[0]))
            })
            .then(trx.commit)
            .catch(trx.rollback)
        })
        .catch(err => res.status(400).json('error'))
});

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    database.select('*').from('users').where({id})
    .then(user => {
        if(user.length){
            res.json(user[0])
        }else{
            res.status(400).json('Not found')
        }
    })
    .catch(err => res.status(400).json('Not found'))
});

app.put('/image', (req, res) => {
    const { id } = req.body;
    database('users').where('id', '=', id)
    .increment('enteries', 1)
    .returning('enteries')
    .then(enteries => {
        res.json(enteries[0].enteries)
    })
    .catch(err => res.status(400).json('error finding'))
})


app.listen(2000, ()=>{
    console.log('Running on port 2000');
});
