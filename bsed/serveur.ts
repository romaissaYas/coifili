import express, { Request, Response, Application } from 'express';
import mysql, { RowDataPacket } from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import produitsRoutes from './routes/produits'; // ✅ On importe ici
import prestationsRoutes from './routes/prestations';
import horairesRoutes from './routes/horraires';
import employesRoutes from './routes/employes';
import rendezvousRoutes from './routes/rendezvous';
import salonsRoutes from './routes/salons';





const app: Application = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'simmimi'; 
// Use env variable
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' })); // Restrict to frontend origin

interface UserData {
  email: string;
  password: string;
  userType: 'coufer' | 'user';
}

interface SuccessResponse {
  message: string;
  id?: number;
  token?: string;
  userType?: string;
}

interface ErrorResponse {
  error: string;
}

interface User extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  userType: string;
}

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gestion',
};

const pool = mysql.createPool(dbConfig);
export { pool };

// Initialize database with retry logic
async function initializeDb() {
  let retries = 3;
  while (retries > 0) {
    try {
      const conn = await pool.getConnection();
      try {
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            userType ENUM('coufer', 'user') NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
          await conn.execute(`
    CREATE TABLE IF NOT EXISTS produits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nom VARCHAR(100) NOT NULL,
      prix DECIMAL(10,2) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

   await conn.execute(`
        CREATE TABLE IF NOT EXISTS prestations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nom VARCHAR(100) NOT NULL,
          prix DECIMAL(10,2) NOT NULL
        )
      `);

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS employes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nom VARCHAR(100) NOT NULL,
          poste VARCHAR(100) NOT NULL
        )
      `);

      
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS horaires (
          id INT AUTO_INCREMENT PRIMARY KEY,
          jour VARCHAR(20) NOT NULL,
          heure_debut TIME NOT NULL,
          heure_fin TIME NOT NULL
        )
      `);

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS rendezvous (
          id INT AUTO_INCREMENT PRIMARY KEY,
          client_nom VARCHAR(100) NOT NULL,
          prestation_id INT NOT NULL,
          date DATE NOT NULL,
          heure TIME NOT NULL,
          FOREIGN KEY (prestation_id) REFERENCES prestations(id)
        )
      `);
await conn.execute(`
  CREATE TABLE IF NOT EXISTS salons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    message TEXT,
    wilaya VARCHAR(100) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,       -- Ajout du champ 'type'
    categorie VARCHAR(50) NOT NULL   -- Ajout du champ 'categorie' (pas de virgule ici)
  )
`);



        console.log('Database initialized');
      } finally {
        conn.release();
      }
      return;
    } catch (error) {
      console.error('Database initialization error:', error);
      retries--;
      if (retries === 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait before retry
    }
  }
}

// Route handler type
type RouteHandler = (req: Request, res: Response) => Promise<void>;

// Register user
const registerUserHandler: RouteHandler = async (req, res) => {
  try {
    const userData = req.body as UserData;
    const { email, password, userType } = userData;

    if (!email || !password || !userType) {
      res.status(400).json({ error: 'Email, mot de passe et type d’utilisateur sont requis' } as ErrorResponse);
      return;
    }

    if (!['coufer', 'user'].includes(userType)) {
      res.status(400).json({ error: 'Type d’utilisateur invalide' } as ErrorResponse);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const [result] = await pool.execute(
        'INSERT INTO users (email, password, userType) VALUES (?, ?, ?)',
        [email, hashedPassword, userType]
      );
      const userId = (result as mysql.OkPacket).insertId;
      const token = jwt.sign({ userId, userType }, JWT_SECRET, { expiresIn: '1h' });

      res.status(201).json({ message: 'Utilisateur inscrit avec succès', id: userId, token, userType } as SuccessResponse);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Cet email est déjà utilisé' } as ErrorResponse);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erreur serveur' } as ErrorResponse);
  }
};

// Login user
const loginUserHandler: RouteHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email et mot de passe sont requis' } as ErrorResponse);
      return;
    }

    const [rows] = await pool.execute<User[]>('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      res.status(401).json({ error: 'Utilisateur non trouvé' } as ErrorResponse);
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Mot de passe incorrect' } as ErrorResponse);
      return;
    }

    const token = jwt.sign({ userId: user.id, userType: user.userType }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Connexion réussie', token, userType: user.userType } as SuccessResponse);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur serveur' } as ErrorResponse);
  }
};

// Assign routes
app.post('/register', (req, res, next) => {
  registerUserHandler(req, res).catch(next);
});

app.post('/login', (req, res, next) => {
  loginUserHandler(req, res).catch(next);
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Erreur serveur' } as ErrorResponse);
});


app.use('/api/salons', salonsRoutes);


app.use('/api/produits', produitsRoutes);
app.use('/api/prestations', prestationsRoutes);
app.use('/api/horaires', horairesRoutes);
app.use('/api/employes', employesRoutes);
app.use('/api/rendezvous', rendezvousRoutes);

// Start server
async function startServer() {
  try {
    await initializeDb();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer();
