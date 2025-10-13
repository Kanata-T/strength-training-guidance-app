export class TrainingController {
    private trainingService: any; // Replace 'any' with the actual type of trainingService

    constructor(trainingService: any) { // Replace 'any' with the actual type of trainingService
        this.trainingService = trainingService;
    }

    public async createTrainingMenu(req: any, res: any): Promise<void> {
        try {
            const trainingMenuData = req.body;
            const newTrainingMenu = await this.trainingService.createTrainingMenu(trainingMenuData);
            res.status(201).json(newTrainingMenu);
        } catch (error) {
            res.status(500).json({ message: 'Error creating training menu', error });
        }
    }

    public async updateTrainingMenu(req: any, res: any): Promise<void> {
        try {
            const { id } = req.params;
            const trainingMenuData = req.body;
            const updatedTrainingMenu = await this.trainingService.updateTrainingMenu(id, trainingMenuData);
            res.status(200).json(updatedTrainingMenu);
        } catch (error) {
            res.status(500).json({ message: 'Error updating training menu', error });
        }
    }

    public async getTrainingMenu(req: any, res: any): Promise<void> {
        try {
            const { id } = req.params;
            const trainingMenu = await this.trainingService.getTrainingMenu(id);
            if (!trainingMenu) {
                res.status(404).json({ message: 'Training menu not found' });
                return;
            }
            res.status(200).json(trainingMenu);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving training menu', error });
        }
    }

    public async getAllTrainingMenus(req: any, res: any): Promise<void> {
        try {
            const trainingMenus = await this.trainingService.getAllTrainingMenus();
            res.status(200).json(trainingMenus);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving training menus', error });
        }
    }
}