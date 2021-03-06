const Product = require('../models/product');
const mongodb = require('mongodb');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        product: {}
    });
};

exports.postAddProduct = (req, res, next) => {
    const { title, price, description, image } = req.body;

    const product = new Product({
        title: title,
        price: price,
        description: description,
        image: image,
        userId: req.user._id
    });

    product
        .save()  // provided by mongoose , technically it doesn't return back a promsise  but we can call then method on it.
        .then(result => {
            console.log('CREATED PRODUCT');
            res.redirect('/admin/products');
        }).catch(err => {
            console.log(err);
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
                    product: product
                });
            }
        })
        .catch(err => {
            console.log(err);
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

    Product.findById(id)
        .then(product => {
            product.title = title;
            product.price = price;
            product.description = description;
            product.image = image;
            return product.save();
        })
        .then(result => {
            console.log('UPDATED PRODUCT');
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log(err);
        })
};

exports.getProducts = (req, res, next) => {

    // Populate allows us to tell mongoose to populate a certain field with all the details and not just the id.

    // Populate takes in the path which we want to populate and we can also populate nested paths.

    // Here we just populate the userId.

    // Select allows us to define which fields we want to select or unselect, so which field should actually be retrieved from the database.

    // To retrieve the properties using select we just need to pass in the name of the fields we want to retrieve and to exclude a specific field just add '-' before it.

    // Id will always be retrieved unless we mention otherwise.

    // Also we can pass in the fields we want populate to retrieve by just mentioning them as the second argument.

    // So we can have selective retrieval in mongoose using select and populate.
    
    Product.find()
        // .select('title price image description -_id')
        .populate('userId', 'name')
        .then(products => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products'
            });
        })
        .catch(err => {
            console.log(err);
        });


};

exports.postDeleteProduct = (req, res, next) => {
    let { id } = req.body;
    id = id.trim();

    Product.deleteOne({ _id: new mongodb.ObjectId(id) })
        .then(() => {
            console.log("PRODUCT DELETED");
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log(err);
        });
};