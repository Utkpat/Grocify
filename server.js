const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PDFDocument = require("pdfkit");

const app = express();
app.use(cors());
app.use(express.json());

// 📌 **Connect to MongoDB**
mongoose.connect("mongodb://localhost:27017/grocery_store", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// 📌 **Order Schema**
const orderSchema = new mongoose.Schema({
    items: String,
    total: Number,
    paymentMethod: String,
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

// 📌 **Get Statistics**
app.get("/statistics", async (req, res) => {
    try {
        const orders = await Order.find();
        
        // Calculate total orders
        const totalOrders = orders.length;
        
        // Calculate total amount
        const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
        
        // Calculate total products sold
        const totalProducts = orders.reduce((sum, order) => {
            const items = order.items.split(', ');
            return sum + items.reduce((itemSum, item) => {
                const match = item.match(/x(\d+)\)/);
                return itemSum + (match ? parseInt(match[1]) : 1);
            }, 0);
        }, 0);
        
        // Calculate average order value
        const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;
        
        // Get payment method distribution
        const paymentMethods = orders.reduce((acc, order) => {
            acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1;
            return acc;
        }, {});
        
        res.json({
            totalOrders,
            totalAmount,
            totalProducts,
            averageOrderValue,
            paymentMethods
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// 📌 **Get Orders**
app.get("/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// 📌 **Create Order**
app.post("/orders", async (req, res) => {
    try {
        const { items, total, paymentMethod } = req.body;
        const order = new Order({
            items,
            total,
            paymentMethod
        });
        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// 📌 **Update Order**
app.put("/orders/:id", async (req, res) => {
    try {
        const { items, total } = req.body;
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id },
            { items, total },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// 📌 **Delete Order**
app.delete("/orders/:id", async (req, res) => {
    try {
        const order = await Order.findOneAndDelete({ _id: req.params.id });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// 📌 **Generate Report**
app.get("/generate-report", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalAmount: { $sum: "$total" },
                    avgOrderValue: { $avg: "$total" }
                }
            }
        ]);

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=order_report.pdf');
        doc.pipe(res);

        doc.fontSize(20).text("📜 Grocify - Order Report", { align: "center" });
        doc.moveDown();

        // Add statistics
        doc.fontSize(14).text("📊 Statistics", { underline: true });
        doc.fontSize(12)
            .text(`Total Orders: ${stats[0]?.totalOrders || 0}`)
            .text(`Total Revenue: ₹${(stats[0]?.totalAmount || 0).toFixed(2)}`)
            .text(`Average Order Value: ₹${(stats[0]?.avgOrderValue || 0).toFixed(2)}`)
            .moveDown();

        // Add order details
        doc.fontSize(14).text("📦 Order Details", { underline: true });
        orders.forEach((order, index) => {
            doc.fontSize(12)
                .text(`Order ${index + 1}:`)
                .text(`Items: ${order.items}`)
                .text(`Total: ₹${order.total}`)
                .text(`Payment Method: ${order.paymentMethod}`)
                .text(`Date: ${order.createdAt.toLocaleString()}`)
                .moveDown();
        });

        doc.end();
    } catch (error) {
        res.status(500).json({ error: "❌ Failed to generate report" });
    }
});

// 📌 **Start Server**
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
