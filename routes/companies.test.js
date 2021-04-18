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
})


describe('GET /', () => {
    test("Should return all companies", async () => {
        const res = await request(app).get('/companies');
        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            "companies": [
                { code: "apple", name: "Apple" },
                { code: "ibm", name: "IBM" },
            ]
        });
    })
})

describe("POST /", function () {

    test("Should add a company", async function () {
        const res = await request(app)
            .post("/companies")
            .send({ name: "TestComp", description: "TEST!" });

        expect(res.status).toEqual(201)


        expect(res.body).toEqual(
            {
                "company": {
                    code: "testcomp",
                    name: "TestComp",
                    description: "TEST!",
                }
            }
        );
    });
});

describe("GET /:code", () => {
    test('Should return company info', async () => {
        const res = await request(app)
            .get('/companies/ibm');

        expect(res.status).toEqual(200);
        expect(res.body).not.toEqual(
            {
                "company": {
                    code: "ibm",
                    name: "IBM",
                    description: "Big blue.",
                    invoices: [3],
                }
            }
        );
    })

    test('Return 404 for no company', async () => {
        const res = await request(app)
            .get('/companies/ibmskd');

        expect(res.status).toEqual(404);
    })
});


describe("PUT /:code", function () {

    test("It should update company", async function () {
        const res = await request(app)
            .put("/companies/apple")
            .send({ name: "orange", description: "test" });

        expect(res.status).toEqual(200);

        expect(res.body).toEqual(
            {
                "company": {
                    code: "apple",
                    name: "orange",
                    description: "test",
                }
            }
        );
    });

});

describe("DELETE /:code", () => {

    test("delete company", async () => {
        const res = await request(app)
            .delete("/companies/apple");

        expect(res.body).toEqual({
            "deleted": {
                "name": "Apple"
            }
        });
    });

    test("It should return 404 if no company", async () => {
        const res = await request(app)
            .delete("/companies/blargh");

        expect(res.status).toEqual(404);
    });
});
