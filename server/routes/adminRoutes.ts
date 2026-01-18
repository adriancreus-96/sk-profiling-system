import express from 'express';
import { getPendingUsers, approveUser, loginAdmin, getAllUsers, updateUser } from '../controllers/adminController';

const router = express.Router();

// Route: GET /api/admin/pending
router.get('/pending', getPendingUsers);

// Route: PUT /api/admin/approve/:id
router.put('/approve/:id', approveUser, updateUser);

router.post('/login', loginAdmin);

router.get('/users', getAllUsers);

export default router;