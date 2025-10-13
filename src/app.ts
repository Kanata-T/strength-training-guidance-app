import express from 'express';
import { json, urlencoded } from 'body-parser';
import authRoutes from './routes/authRoutes';
import trainingRoutes from './routes/trainingRoutes';
import { authMiddleware } from './middleware/authMiddleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(authMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/training', trainingRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});