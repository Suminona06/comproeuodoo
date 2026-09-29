import { query, execute } from '../config/database.js';

export const leadModel = {
  async findAll(options = {}) {
    const { status, type, limit, offset } = options;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('l.status = ?');
      params.push(status);
    }
    if (type) {
      conditions.push('l.type = ?');
      params.push(type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    let sql = `
      SELECT l.*, p.name_id as product_name_id
      FROM leads l
      LEFT JOIN products p ON l.product_id = p.id
      ${whereClause}
      ORDER BY l.created_at DESC, l.id DESC
    `;

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit, 10));
      if (offset) {
        sql += ' OFFSET ?';
        params.push(parseInt(offset, 10));
      }
    }

    return await query(sql, params);
  },

  async countAll(options = {}) {
    const { status, type } = options;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(`SELECT COUNT(*) as total FROM leads ${whereClause}`, params);
    return rows[0]?.total || 0;
  },

  async findById(id) {
    const rows = await query(
      `SELECT l.*, p.name_id as product_name_id, p.slug as product_slug
       FROM leads l
       LEFT JOIN products p ON l.product_id = p.id
       WHERE l.id = ? LIMIT 1`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async create(data) {
    const result = await execute(
      `INSERT INTO leads (type, name, company, email, phone, product_id, quantity, message, status, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.type || 'inquiry',
        data.name,
        data.company,
        data.email,
        data.phone,
        data.product_id ? parseInt(data.product_id, 10) : null,
        data.quantity || null,
        data.message,
        data.status || 'baru',
        data.ip_address || null
      ]
    );
    return result.insertId;
  },

  async updateStatus(id, status, adminNotes = null) {
    const fields = ['status = ?'];
    const values = [status];

    if (adminNotes !== null) {
      fields.push('admin_notes = ?');
      values.push(adminNotes);
    }

    values.push(id);
    const sql = `UPDATE leads SET ${fields.join(', ')} WHERE id = ?`;
    const result = await execute(sql, values);
    return result.affectedRows > 0;
  },

  async exportAll() {
    return await query(`
      SELECT 
        l.id,
        l.created_at as tanggal,
        l.type as jenis_inquiry,
        l.name as nama,
        l.company as perusahaan,
        l.email,
        l.phone as telepon,
        IFNULL(p.name_id, '-') as produk_terkait,
        IFNULL(l.quantity, '-') as estimasi_kuantitas,
        REPLACE(REPLACE(l.message, '\r', ' '), '\n', ' ') as pesan,
        l.status,
        IFNULL(l.admin_notes, '') as catatan_admin
      FROM leads l
      LEFT JOIN products p ON l.product_id = p.id
      ORDER BY l.created_at DESC
    `);
  }
};

export default leadModel;
