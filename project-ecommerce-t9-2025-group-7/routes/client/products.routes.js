// backend/routes/product.js
router.get('/products/category/:id', async (req, res) => {
  const database = await db();
  const products = database.collection('products');
  const categories = database.collection('category');

  const categoryId = req.params.id;
  const category = await categories.findOne({ _id: new ObjectId(categoryId) });
  const productList = await products.find({ category: categoryId }).toArray();

  res.json({
    category,
    products: productList
  });
});
