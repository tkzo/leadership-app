import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error('DATABASE_URL environment variable is required');
	process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function seed() {
	try {
		// Hash password for admin user
		const passwordHash = await bcrypt.hash('admin123', 10);

		// Create admin user
		const result = await pool.query(
			`INSERT INTO users (name, title, level, admin, email, password_hash, email_verified)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 ON CONFLICT (email) DO NOTHING
			 RETURNING uid, email`,
			['Admin User', 'System Administrator', 1, true, 'admin@example.com', passwordHash, true]
		);

		if (result.rows.length > 0) {
			console.log('Admin user created:', result.rows[0].email);
		} else {
			console.log('Admin user already exists');
		}

		// Create some sample strategic priorities
		const priorities = [
			{ name: 'Revenue Growth', description: 'Increase revenue through new markets and products' },
			{ name: 'Customer Satisfaction', description: 'Improve NPS and customer retention' },
			{ name: 'Operational Excellence', description: 'Streamline processes and reduce costs' }
		];

		for (const priority of priorities) {
			await pool.query(
				`INSERT INTO strategic_priorities (name, description)
				 VALUES ($1, $2)
				 ON CONFLICT DO NOTHING`,
				[priority.name, priority.description]
			);
		}
		console.log('Strategic priorities created');

		console.log('Seed completed successfully');
	} catch (error) {
		console.error('Seed failed:', error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

seed();
