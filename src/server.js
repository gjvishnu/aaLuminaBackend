import express from 'express';
import prisma, { connectDatabase } from './db.js';
import departmentRoutes from './routes/departmentRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/departments', departmentRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Express server is running');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const startServer = async () => {
  try {
    await connectDatabase();
    console.log('Connected to PostgreSQL database');

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to PostgreSQL database:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
