const pg = require('pg');
const express = require('express');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_acme_ice_cream_shop_db');
const app = express();

app.use(express.json());
app.use(require('morgan')('dev'));

// READ -- GET returns an array of flavors
app.get('/api/flavors', async (req, res, next) => {
    try {
        const SQL = `
            SELECT * from flavors ORDER BY created_at DESC;
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        console.error("There was an error getting all flavors", error);
    }
});

// READ -- GET returns a single flavor
app.get('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
            SELECT * FROM flavors WHERE id=$1;
        `;
        const response = await client.query(SQL, [req.params.id]);
        res.send(response.rows[0]);
    } catch (error) {
        console.error("There was an error getting single flavor", error);
    }
});

// CREATE -- POST has flavor to create as payload, returns the created flavor
app.post('/api/flavors', async (req, res, next) => {
    try {
        const SQL = `
            INSERT INTO flavors (name)
            VALUES($1)
            RETURNING *
        `;
        const response = await client.query(SQL, [req.body.name]);
        res.send(response.rows[0]);
    } catch (error) {
        console.error("There was an error creating flavor", error);
    }
});

// DELETE -- DELETE returns nothing
app.delete('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
            DELETE from flavors
            WHERE id=$1
        `;
        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (error) {
        console.error("There was an error deleting flavor", error);
    }
});

// UPDATE -- PUT has the updated flavor as the payload, returns the updated flavor
app.put('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
            UPDATE flavors
            SET name=$1,
            is_favorite=$2,
            updated_at=now()
            WHERE id=$3 RETURNING *
        `;
        const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id]);
        res.send(response.rows[0]);
    } catch (error) {
        console.error("There was an error updating flavor", error);
    }
});

const init = async () => {
    await client.connect();
    console.log("Connected to the database");
    let SQL = `
        DROP TABLE IF EXISTS flavors;
        CREATE TABLE flavors(
            id SERIAL PRIMARY KEY,
            name VARCHAR(50),
            is_favorite BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        )
    `;
    await client.query(SQL);
    console.log("Tables created");
    SQL = `
        INSERT INTO flavors(name, is_favorite) VALUES('vanilla', false);
        INSERT INTO flavors(name, is_favorite) VALUES('chocolate', false);
        INSERT INTO flavors(name, is_favorite) VALUES('strawberry', true);
    `;
    await client.query(SQL);
    console.log("Data seeded");
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Listening on port ${port}`));
}

init();