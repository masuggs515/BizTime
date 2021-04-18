
const request = require('supertest');

const app = require("../app");
const db = require("../db");

beforeEach(async () => {
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
    await db.query("SELECT setval('invoices_id_seq', 1, false)");
    await db.query(`
    INSERT INTO companies (code, name, description)
        VALUES ('apple', 'Apple', 'Maker of OSX.'),
               ('ibm', 'IBM', 'Big blue.')`);

    await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
        VALUES ('apple', 100, false, '2018-01-01', null),
                ('apple', 200, true, '2018-02-01', '2018-02-02'), 
                ('ibm', 300, false, '2018-03-01', null)`);
});

afterAll(() => {
    db.end();
});

describe("GET /", () => {

    test("Should return array of invoices", async () => {
        const res = await request(app).get("/invoices");
        expect(res.status).toEqual
        expect(res.body).toEqual({
            "invoices": [
                { id: 1, comp_code: "apple" },
                { id: 2, comp_code: "apple" },
                { id: 3, comp_code: "ibm" },
            ]
        });
    })

});

describe("GET /:id", () => {
    test("Should return invoice info", async () => {
        const res = await request(app).get('/invoices/1');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            {
                "invoice": {
                    id: 1,
                    amt: 100,
                    add_date: '2018-01-01T05:00:00.000Z',
                    paid: false,
                    paid_date: null,
                    company: {
                        code: 'apple',
                        name: 'Apple',
                        description: 'Maker of OSX.',
                    }
                }
            }
        );
    })
    test("Should return 404 with nonexistant company", async () => {
        const res = await request(app).get("/invoices/27");
        expect(res.status).toEqual(404);
    })
});

describe("POST /", () => {
    test("Should add new invoice", async () => {
        const res = await request(app)
            .post("/invoices")
            .send({ amt: 250, comp_code: 'apple' });

        expect(res.status).toBe(201)

        expect(res.body).toEqual(
            {
                "invoice": {
                    id: 4,
                    comp_code: "apple",
                    amt: 250,
                    add_date: "2021-04-18T04:00:00.000Z",
                    paid: false,
                    paid_date: null,
                }
            }
        );
    });

});


describe("PUT /", () => {

    test("Return updated invoice", async () => {
        const res = await request(app)
            .put("/invoices/1")
            .send({ amt: 250, paid: false });

        expect(res.status).toBe(200)

        expect(res.body).toEqual(
            {
                "invoice": {
                    id: 1,
                    comp_code: 'apple',
                    paid: false,
                    amt: 250,
                    add_date: expect.any(String),
                    paid_date: null,
                }
            }
        );
    });

    test("If no invoice should return 404", async () => {
        const res = await request(app)
            .put("/invoices/72")
            .send({ amt: 450 });

        expect(res.status).toEqual(404);
    });

});

describe("DELETE /", ()=> {

    test("Delete Invoice", async ()=> {
        const res = await request(app)
        .delete("/invoices/1");

        expect(res.body).toEqual({  deleted: {
            "id": 1,
            "comp_code": "apple"
        }  });
    });

    test("If invoice doesn't exist return 404", async ()=> {
        const res = await request(app)
        .delete("/invoices/75");

        expect(res.status).toEqual(404);
    });
});