"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const adminEmail = 'admin@example.com';
    // IMPORTANT: In a real application, this password should be securely hashed.
    // This script sets a plain text password. The import process might only
    // check for user existence by email, or you might need to update this
    // user's password later through your application's standard auth flow.
    const adminPassword = 'adminpassword';
    try {
        // Check if the admin user already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail },
        });
        if (existingAdmin) {
            console.log(`User with email ${adminEmail} already exists (ID: ${existingAdmin.user_id}). No action taken.`);
            return;
        }
        // Create the admin user
        const adminUser = await prisma.user.create({
            data: {
                email: adminEmail,
                name: 'Admin User', // You can change this name if you like
                password: adminPassword,
                role: 'ADMIN', // Use string literal
                status: 'ACTIVE', // Use string literal
                emailVerified: new Date(), // Mark email as verified
            },
        });
        console.log(`Admin user created successfully with email ${adminEmail} (ID: ${adminUser.user_id})`);
    }
    catch (error) {
        console.error('Error during admin user creation:', error);
        process.exit(1); // Exit with error code
    }
    finally {
        await prisma.$disconnect();
    }
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
