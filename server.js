const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors'); // Import cors
const Transaction = require('./models/Transaction'); // Define your MongoDB schema/model

const app = express();

// Middleware
app.use(cors()); // Use cors

// Initialize MongoDB connection
mongoose.connect('mongodb://localhost:27017/your_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Endpoint to initialize database from third-party API with dummy data
app.get('/api/initialize', async (req, res) => {
  try {
    const transactions = [
      // Add your dummy transactions here
      { title: 'Product 1', description: 'Description 1', price: 100, category: 'Category 1', dateOfSale: '2023-03-01', sold: true },
      { title: 'Product 2', description: 'Description 2', price: 200, category: 'Category 2', dateOfSale: '2023-03-02', sold: false },
      // More dummy transactions...
    ];

    // Clear existing data
    await Transaction.deleteMany({});
    // Insert transactions into MongoDB
    await Transaction.insertMany(transactions);

    res.status(200).json({ message: 'Database initialized successfully with dummy data' });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({ message: 'Failed to initialize database' });
  }
});

// Define other APIs (transactions, statistics, bar chart, pie chart) similarly...

// Endpoint to list all transactions with pagination and search
app.get('/api/transactions', async (req, res) => {
  try {
    const { month, search, page = 1, perPage = 10 } = req.query;

    // Build query conditions
    const query = {
      dateOfSale: { $regex: new RegExp(month, 'i') }, // Case-insensitive search by month
    };

    if (search) {
      query.$or = [
        { title: { $regex: new RegExp(search, 'i') } },
        { description: { $regex: new RegExp(search, 'i') } },
        { price: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const totalCount = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      total: totalCount,
      page,
      perPage,
      transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// Endpoint to calculate statistics for a specific month
app.get('/api/statistics', async (req, res) => {
  try {
    const { month } = req.query;

    const query = {
      dateOfSale: { $regex: new RegExp(month, 'i') }, // Case-insensitive search by month
    };

    const totalSaleAmount = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: null, totalAmount: { $sum: '$price' } } },
    ]);

    const totalSoldItems = await Transaction.countDocuments(query);
    const totalNotSoldItems = await Transaction.countDocuments({
      ...query,
      sold: false,
    });

    res.status(200).json({
      totalSaleAmount: totalSaleAmount.length > 0 ? totalSaleAmount[0].totalAmount : 0,
      totalSoldItems,
      totalNotSoldItems,
    });
  } catch (error) {
    console.error('Error calculating statistics:', error);
    res.status(500).json({ message: 'Failed to calculate statistics' });
  }
});

// Endpoint to generate bar chart data for price ranges
app.get('/api/bar-chart', async (req, res) => {
  try {
    const { month } = req.query;

    const query = {
      dateOfSale: { $regex: new RegExp(month, 'i') }, // Case-insensitive search by month
    };

    const priceRanges = [
      { range: '0-100', count: await Transaction.countDocuments({ ...query, price: { $gte: 0, $lte: 100 } }) },
      { range: '101-200', count: await Transaction.countDocuments({ ...query, price: { $gte: 101, $lte: 200 } }) },
      { range: '201-300', count: await Transaction.countDocuments({ ...query, price: { $gte: 201, $lte: 300 } }) },
      { range: '301-400', count: await Transaction.countDocuments({ ...query, price: { $gte: 301, $lte: 400 } }) },
      { range: '401-500', count: await Transaction.countDocuments({ ...query, price: { $gte: 401, $lte: 500 } }) },
      { range: '501-600', count: await Transaction.countDocuments({ ...query, price: { $gte: 501, $lte: 600 } }) },
      { range: '601-700', count: await Transaction.countDocuments({ ...query, price: { $gte: 601, $lte: 700 } }) },
      { range: '701-800', count: await Transaction.countDocuments({ ...query, price: { $gte: 701, $lte: 800 } }) },
      { range: '801-900', count: await Transaction.countDocuments({ ...query, price: { $gte: 801, $lte: 900 } }) },
      { range: '901-above', count: await Transaction.countDocuments({ ...query, price: { $gte: 901 } }) },
    ];

    res.status(200).json(priceRanges);
  } catch (error) {
    console.error('Error generating bar chart data:', error);
    res.status(500).json({ message: 'Failed to generate bar chart data' });
  }
});

// Endpoint to generate pie chart data for categories
app.get('/api/pie-chart', async (req, res) => {
  try {
    const { month } = req.query;

    const query = {
      dateOfSale: { $regex: new RegExp(month, 'i') }, // Case-insensitive search by month
    };

    const categoryCounts = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    res.status(200).json(categoryCounts);
  } catch (error) {
    console.error('Error generating pie chart data:', error);
    res.status(500).json({ message: 'Failed to generate pie chart data' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
