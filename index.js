const express =  require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const {v4} = require('uuid')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express();

const port = process.env.PORT || 5000;
const dbPath = path.join(__dirname, "crudApp.db")
let database = null

app.use(bodyParser.json());
app.use(cors());

const initializeDBANDServer = async () => {
    try {
        database = await open({
            filename: dbPath,
            driver: sqlite3.Database
        })
        app.listen(port, () => console.log(`Server Running at https://localhost:${port}`))
    } catch (error) {
        console.log(`DB Error: ${error}`)
        process.exit(1)
    }
}
initializeDBANDServer()

app.get("/", (request, response) => response.send(JSON.stringify("Hello from Express")))

app.post("/signup", async (request, response) => {
    const {username, password} = request.body
    const getUserQuery = `SELECT * FROM users WHERE username='${username}'`
    const user = await database.get(getUserQuery)
    if (user === undefined) {
        const encryptPassword = await bcrypt.hash(password, 5)
        const createUserQuery = `INSERT INTO users (username, password) VALUES ('${username}', '${encryptPassword}')`    
        await database.run(createUserQuery)
        response.send(JSON.stringify("User created successfully"))
    } else {
        response.status = 400
        response.send(JSON.stringify("Username already exits"))
    }
})

app.post("/login", async (request, response) => {
    const {username, password} = request.body
    const getUserQuery = `SELECT * FROM users WHERE username='${username}'`
    const user = await database.get(getUserQuery)
    if (user === undefined) {
        response.status = 400
        response.send(JSON.stringify("Invalid User"))
    } else {
        const isPasswordMatched = await bcrypt.compare(password, user.password)
        if (isPasswordMatched) {
            const payload = {username}
            const jwtToken = jwt.sign(payload, "password")
            response.send({jwtToken})
        } else {
            response.status = 400
            response.send(JSON.stringify("Invalid Password"))
        }
    }
})

app.get("/users", async (request, response) => {
    const getUserQuery = 'SELECT * FROM user_details'
    const users = await database.all(getUserQuery)
    response.send(users)
})

app.get("/user/:id", async (request, response) => {
    const {id} = request.params
    const getUserQuery = `SELECT * FROM user_details WHERE id='${id}'`
    const user = await database.get(getUserQuery)
    response.send(user)
})

app.post("/user", async (request, response) => {
    const {name, gender, mobile, email, dob} = request.body
    const createUserQuery = `INSERT INTO user_details (id, name, gender, mobile, email, dob) VALUES ('${v4()}', '${name}', '${gender}', '${mobile}', '${email}', '${dob}');`
    await database.run(createUserQuery)
    response.send(JSON.stringify('Create User Successfully'))
})

app.delete("/user/:id", async (request, response) => {
    const {id} = request.params
    const deleteUserQuery = `DELETE FROM user_details WHERE id='${id}';`
    await database.run(deleteUserQuery)
    response.send(JSON.stringify('User Deleted Successfully'))
})

app.put("/user/:id", async (request, response) => {
    const {id} = request.params
    const {name, gender, mobile, email, dob} = request.body
    const updateUserQuery = `UPDATE user_details SET name='${name}', gender='${gender}', mobile='${mobile}', email='${email}', dob='${dob}' WHERE id='${id}';`
    await database.run(updateUserQuery)
    response.send(JSON.stringify('User Details Updated Successfully'))
})

app.get("*", (request, response) => response.send(JSON.stringify("That Route doesn't exist")))
