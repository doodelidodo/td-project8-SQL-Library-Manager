const express = require('express');
const router = express.Router();
const Book = require('../models').Book;
const { Op } = require("sequelize");
const booksLimit = 5;


function asyncHandler(cb){
    return async(req, res, next) => {
        try {
            await cb(req, res, next)
        } catch(error){
            // Forward error to the global error handler
            next(error);
        }
    }
}

// https://stackoverflow.com/questions/47546824/sequelize-configuration-to-retrieve-total-count-with-details
// https://medium.com/@pprachit09/pagination-using-mongoose-express-and-pug-7033cb487ce7
router.get('/', asyncHandler(async (req, res) =>  {
    const offset = req.query.offset ? req.query.offset : 0;
    if(req.query.search) {
        const search = req.query.search;

        const {count, rows: books} = await Book.findAndCountAll({
            where: {
                [Op.or]: [
                    { title: {
                            [Op.like]: '%' + search + '%'
                        } },
                    { author: {
                            [Op.like]: '%' + search + '%'
                        } },
                    { genre: {
                            [Op.like]: '%' + search + '%'
                        } },
                    { year: {
                            [Op.like]: '%' + search + '%'
                        } }
                ]
            },
            limit: booksLimit,
            offset: offset * booksLimit
        });
        res.render('index', {books, search, count, offset, booksLimit});
    } else {
        const {count, rows: books} = await Book.findAndCountAll(
            {
                limit: booksLimit,
                offset: offset * booksLimit,
                order: [
                    ['title', 'ASC'],
                ]
            }
        );
        res.render('index', {books, count, offset, booksLimit});
    }
}));

router.get('/new', asyncHandler(async (req, res) =>  {
    res.render("books/new", { book: {}, title: "New Book" });
}));

router.post('/', asyncHandler(async (req, res) =>  {
    let book;
    try {
        book = await Book.create(req.body);
        res.redirect("/");
    } catch (error) {
        if(error.name === "SequelizeValidationError") {
            book = await Book.build(req.body);
            res.render("books/new", {book, errors: error.errors, title: "New Article"});
        } else {
            throw error;
        }
    }
}));

router.get('/:id', asyncHandler(async (req, res) =>  {
    const book = await Book.findByPk(req.params.id);
    if(book) {
        res.render('books/update-book', {book, title:'Update Book'});
    } else {
        const err = new Error('not Found');
        err.status = 404;
        throw err;
    }
}));

router.post('/search', asyncHandler(async (req, res) => {
    const search = req.body.search;
    console.log(search);
    if(search) {
        const encryptSearch = encodeURIComponent(search)
        res.redirect('/books/?search=' + encryptSearch);
    } else {
        res.redirect('/');
    }
}));

router.post('/:id', asyncHandler(async (req, res) =>  {
    let book;
    try {
        book = await Book.findByPk(req.params.id);
        if(book) {
            await book.update(req.body);
            res.redirect("/");
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        if(error.name === "SequelizeValidationError") {
            book = await Book.build(req.body);
            book.id = req.params.id;
            res.render("books/update-book", {book, errors: error.errors, title: "Update Book"});
        } else {
            throw error;
        }
    }
}));

router.post('/:id/delete', asyncHandler(async (req, res) =>  {
    const book = await Book.findByPk(req.params.id);
    if(book) {
        await book.destroy();
        res.redirect("/");
    } else {
        const err = new Error('not Found');
        err.status = 404;
        throw err;
    }
}));


module.exports = router;