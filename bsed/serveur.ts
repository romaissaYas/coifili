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
  userType: 'coiffeur' | 'user';
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
        CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    userType ENUM('coiffeur', 'user') NOT NULL, -- coiffeur ou client
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
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
        ouvert TINYINT(1) NOT NULL DEFAULT 0
      );
    `);

    // Table creneaux
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS creneaux (
        id INT AUTO_INCREMENT PRIMARY KEY,
        horaire_id INT NOT NULL,
        heure_debut TIME NOT NULL,
        heure_fin TIME NOT NULL,
        FOREIGN KEY (horaire_id) REFERENCES horaires(id) ON DELETE CASCADE
      );
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
    type VARCHAR(50) NOT NULL,
    categorie VARCHAR(50) NOT NULL,
    image VARCHAR(50) NOT NULL,
    userId INT NOT NULL, -- 🔗 lien avec l'utilisateur
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

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
const JWT_EXPIRES_IN = '7d'
const registerUserHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firstName, lastName, email, phone, password, userType } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !phone || !password || !userType) {
            res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
            return;
        }

        if (!['coiffeur', 'user'].includes(userType)) {
            res.status(400).json({ message: 'Type utilisateur invalide.' });
            return;
        }

        // Vérifier si l'email existe déjà
        const [existingUser] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        ) as any[];

        if (existingUser.length > 0) {
            res.status(400).json({ message: 'Cet email est déjà utilisé.' });
            return;
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insérer dans la base
        const [result] = await pool.query(
            'INSERT INTO users (firstName, lastName, email, phone, password, userType) VALUES (?, ?, ?, ?, ?, ?)',
            [firstName, lastName, email, phone, hashedPassword, userType]
        ) as any;

        const userId = result.insertId;

        // Générer le token
        const token = jwt.sign(
            { id: userId, email, userType },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'Utilisateur créé avec succès.',
            token,
            user: { id: userId, firstName, lastName, email, phone, userType }
        });

    } catch (error) {
        console.error('Erreur lors de l’inscription :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
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

app.post('/register', registerUserHandler);

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
