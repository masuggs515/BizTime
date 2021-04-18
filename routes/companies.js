const express = require('express');
const ExpressError = require('../expressError');
const router = new express.Router();
const db = require('../db');
const slugify = require('slugify');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT code, name FROM companies`);
        return res.json({ "companies": results.rows });
    } catch (e) {
        return next(e)
    }
});

router.post('/', async (req, res, next) => {
    try {
        let { name, description } = req.body;
        let code = slugify(name, {"strict": true, "lower":true})

        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES($1, $2, $3) RETURNING code, name, description`, [code, name, description]);
        return res.status(201).json({ "company": results.rows[0] })
    } catch (e) {
        return next(e)
    }
})

router.get('/:code', async (req, res, next) => {
    try {
        const code = req.params.code;
        const results = await db.query(`SELECT name, code, description FROM companies WHERE code=$1`, [code]);
        if (results.rows.length === 0) throw new ExpressError(`No company: ${code}`, 404);

        const invoiceResults = await db.query(`SELECT id FROM invoices WHERE comp_code = $1`, [code])
        const indusResults = await db.query(`
        SELECT ind.industry FROM companies AS c
        LEFT JOIN companies_industries AS ci
        ON c.code = ci.comp_code
        LEFT JOIN industries AS ind
        ON ci.industry_code = ind.code
        WHERE c.code = $1
        `,[code])

        const company = results.rows[0];
        const compInvoices = invoiceResults.rows;
        const compIndus = indusResults.rows;

        company.invoices = compInvoices.map(i=>i.id);
        company.industries = compIndus.map(x=> x.industry)

        return res.json({ "company": company});
    } catch (e) {
        return next(e);
    }
});

router.put('/:code', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const { code } = req.params;

        const results = await db.query(`
        UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`,
            [name, description, code]);

        if (results.rows.length === 0) throw new ExpressError(`No company: ${code}`, 404);

        return res.json({ "company": results.rows[0] });
    } catch (e) {
        return next(e);
    };
});

router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query(`DELETE FROM companies WHERE code = $1 RETURNING name`, [code]);

        if (results.rows.length === 0) throw new ExpressError(`No company: ${code}`, 404);

        return res.json({ deleted: results.rows[0] });
    } catch (e) {
        next(e);
    };
});


module.exports = router;