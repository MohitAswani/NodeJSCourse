const Product = require('../models/product');

const { validationResult } = require('express-validator');
const { default: mongoose } = require('mongoose');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        product: {},
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};

exports.postAddProduct = (req, res, next) => {
    const { title, price, description, image } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                image: image,
                description: description
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    const product = new Product({
        title: title,
        price: price,
        description: description,
        image: image,
        userId: req.user._id
    });

    product
        .save()
        .then(result => {
            console.log('CREATED PRODUCT');
            res.redirect('/admin/products');
        }).catch(err => {

            // return res.status(500).render('admin/edit-product', {
            //     pageTitle: 'Add Product',
            //     path: '/admin/add-product',
            //     editing: false,
            //     hasError:true,
            //     product: {
            //         title:title,
            //         price:price,
            //         image:image,
            //         description:description
            //     },
            //     errorMessage:'Database operation failed, please try again.',
            //     validationErrors:[]
            // });

            // We do return the same page and display the error on it but sometimes we have bigger problems and we don't want to return the same page.

            // So instead of returning to the same page we redirect to the /500 error page since server error is a huge issue and the user should not continue further.

            // res.redirect('/500');

            // Since we will have to redirect to this page everywhere in the app, to prevent that we use the inbuilt error handler in express and we throw an error object from every catch block.

            // So we create an error object ,set the status code and then pass this error object to the next function. 

            // So when we call next with an error passed as an argument, then we actually let express know that an error occurred and it will skip all other middlewares and move right to an error handling middleware.

            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;

    if (!editMode) {
        return res.redirect('/');
    }

    const prodId = req.params.productId;

    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
            else {
                res.render('admin/edit-product', {
                    pageTitle: 'Edit Product',
                    path: '/admin/edit-product',
                    editing: true,
                    product: product,
                    hasError: false,
                    errorMessage: null,
                    validationErrors: [],
                });
            }
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
};

exports.postEditProduct = (req, res, next) => {
    let id = req.body.id
    let { title, price, description, image } = req.body;
    id = id.trim();
    title = title.trim();
    price = parseFloat(price);
    description = description.trim();
    image = image.trim();

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: {
                _id: id,
                title: title,
                price: price,
                image: image,
                description: description
            },
            validationErrors: errors.array(),
            errorMessage: errors.array()[0].msg
        });
    }

    Product.findById(id)
        .then(product => {

            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }

            product.title = title;
            product.price = price;
            product.description = description;
            product.image = image;
            return product.save()
                .then(result => {
                    console.log('UPDATED PRODUCT');
                    res.redirect('/admin/products');
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
};

exports.getProducts = (req, res, next) => {

    Product.find({ userId: req.user._id })
        .populate('userId', 'name')
        .then(products => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products',
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });


};

exports.postDeleteProduct = (req, res, next) => {
    let { id } = req.body;
    id = id.trim();

    Product.deleteOne({ _id: id, userId: req.user._id })
        .then(() => {
            console.log("PRODUCT DELETED");
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};