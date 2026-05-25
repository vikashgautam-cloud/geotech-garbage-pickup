cat > /home/claude/grwms/src/data/seedDatabase.js << 'EOF'
import { db } from '../utils/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { generateComplaints } from './mockData';

export async function seedFirestoreDatabase() {
  const existingData = generateComplaints(10); // Generates 10 logs based on your model schemas
  console.log("Starting cloud ecosystem population procedure...");
  
  for (const item of existingData) {
    try {
      await addDoc(collection(db, "complaints"), {
        ...item,
        reportedAt: new Date(item.reportedAt),
        resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : null
      });
    } catch (e) {
      console.error("Database seed insertion trace error: ", e);
    }
  }
  console.log("Migration process completed successfully! Check console screen matrix.");
}
EOF
