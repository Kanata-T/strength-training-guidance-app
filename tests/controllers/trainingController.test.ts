import { Request, Response } from 'express';
import TrainingController from '../../src/controllers/trainingController';
import { mockRequest, mockResponse } from 'jest-mock-req-res';

describe('TrainingController', () => {
    let trainingController: TrainingController;

    beforeEach(() => {
        trainingController = new TrainingController();
    });

    describe('createTrainingMenu', () => {
        it('should create a training menu and return it', async () => {
            const req = mockRequest({
                body: {
                    name: 'Strength Training',
                    exercises: ['Squats', 'Deadlifts', 'Bench Press'],
                },
            });
            const res = mockResponse();

            await trainingController.createTrainingMenu(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Strength Training',
                exercises: ['Squats', 'Deadlifts', 'Bench Press'],
            }));
        });
    });

    describe('getTrainingMenu', () => {
        it('should return a training menu by ID', async () => {
            const req = mockRequest({
                params: {
                    id: '1',
                },
            });
            const res = mockResponse();

            await trainingController.getTrainingMenu(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                id: '1',
                name: expect.any(String),
                exercises: expect.any(Array),
            }));
        });
    });

    describe('updateTrainingMenu', () => {
        it('should update a training menu and return it', async () => {
            const req = mockRequest({
                params: {
                    id: '1',
                },
                body: {
                    name: 'Updated Strength Training',
                },
            });
            const res = mockResponse();

            await trainingController.updateTrainingMenu(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                id: '1',
                name: 'Updated Strength Training',
            }));
        });
    });

    describe('deleteTrainingMenu', () => {
        it('should delete a training menu by ID', async () => {
            const req = mockRequest({
                params: {
                    id: '1',
                },
            });
            const res = mockResponse();

            await trainingController.deleteTrainingMenu(req, res);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });
    });
});