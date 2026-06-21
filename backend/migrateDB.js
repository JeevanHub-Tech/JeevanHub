const { MongoClient } = require('mongodb');

const sourceUri = "mongodb+srv://dbUser:WNlbmU4iD0EeesSx@ayurveda-db.juhozmx.mongodb.net/";
const destUri = "mongodb+srv://bhawaniola08:ZoI5edX1hpGRxKWi@cluster0.miwtf.mongodb.net/";

async function migrate() {
    const sourceClient = new MongoClient(sourceUri);
    const destClient = new MongoClient(destUri);

    try {
        console.log("Connecting to Source Cluster...");
        await sourceClient.connect();
        console.log("Connecting to Destination Cluster...");
        await destClient.connect();

        const adminDb = sourceClient.db("admin");
        const databasesList = await adminDb.admin().listDatabases();

        const skipDbs = ['admin', 'local', 'config'];

        for (const dbInfo of databasesList.databases) {
            if (skipDbs.includes(dbInfo.name)) continue;

            console.log(`\nMigrating database: ${dbInfo.name}`);
            const sourceDb = sourceClient.db(dbInfo.name);
            const destDb = destClient.db(dbInfo.name);

            const collections = await sourceDb.listCollections().toArray();

            for (const colInfo of collections) {
                if (colInfo.name.startsWith('system.')) continue;

                console.log(`  -> Migrating collection: ${colInfo.name}`);
                const sourceCollection = sourceDb.collection(colInfo.name);
                const destCollection = destDb.collection(colInfo.name);

                const docs = await sourceCollection.find({}).toArray();

                if (docs.length > 0) {
                    // Clear existing destination collection data and indexes to avoid conflicts
                    await destCollection.drop().catch(() => {});
                    await destCollection.insertMany(docs);
                    console.log(`     Inserted ${docs.length} documents.`);
                } else {
                    console.log(`     0 documents found. Skipping.`);
                }
            }
        }
        
        console.log("\nMigration completed successfully!");

    } catch (err) {
        console.error("Error during migration:", err);
    } finally {
        await sourceClient.close();
        await destClient.close();
    }
}

migrate();
