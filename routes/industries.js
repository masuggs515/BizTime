const express = require('express');
const ExpressError = require('../expressError');
const router = new express.Router();
const db = require('../db');

router.get('/:code', async (req, res, next)=>{
    try {
        const {code} = req.params;
        const results = await db.query(`
        SELECT industry FROM industries
        WHERE code=$1
        `, [code]);

        const compResults = await db.query(`
        SELECT c.name FROM companies AS c
        JOIN companies_industries AS ci
        ON c.code = ci.comp_code
        WHERE ci.industry_code = $1
        `, [code]);
        

        const industry = results.rows[0];
        const companies = compResults.rows;
        industry.companies = companies.map(c => c.name)

        return res.json(industry)
    } catch (e) {
        return next(e);
    }
});

router.post('/', async (req, res, next)=>{
    try {
        let { code, industry } = req.body;
        const results = await db.query(`INSERT INTO industries (code, industry) VALUES($1, $2) 
        RETURNING industry`, [code, industry]);
        return res.status(201).json({ "added industry": results.rows[0] })
    } catch (e) {
        return next(e);
    }
});

router.post('/:code', async (req, res, next)=>{
    try {
        const {code} = req.params;
        const {comp} = req.body;
        const results = await db.query(`
        INSERT INTO companies_industries (industry_code, comp_code) VALUES($1, $2)
        RETURNING comp_code`, [code, comp]);

        return res.json(results.rows)
    } catch (e) {
        return next(e);
    }
});

module.exports = router;