import { Router } from 'express';

const router = Router();

// Admin Login View
router.get('/login', (req, res) => {
  res.render('admin/login', {
    title: 'Login Admin - PT Euodoo CMS',
    layout: false,
    error: null
  });
});

// Admin Dashboard
router.get(['/', '/dashboard'], (req, res) => {
  res.render('admin/dashboard', {
    title: 'Dashboard Administrasi - PT Euodoo',
    activeNav: 'dashboard'
  });
});

export default router;
