import { TrainingRecord } from '../types';
import { Database } from '../utils/database'; // Assuming a database utility is available

class TrainingService {
    private db: Database;

    constructor() {
        this.db = new Database(); // Initialize the database connection
    }

    public async saveTrainingRecord(record: TrainingRecord): Promise<void> {
        await this.db.insert('training_records', record);
    }

    public async getTrainingRecords(userId: string): Promise<TrainingRecord[]> {
        return await this.db.find('training_records', { userId });
    }

    public async updateTrainingRecord(recordId: string, updatedRecord: Partial<TrainingRecord>): Promise<void> {
        await this.db.update('training_records', recordId, updatedRecord);
    }

    public async deleteTrainingRecord(recordId: string): Promise<void> {
        await this.db.delete('training_records', recordId);
    }
}

export default new TrainingService();