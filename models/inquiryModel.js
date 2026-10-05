import { query, execute } from '../config/database.js';

export const inquiryModel = {
  async findAll(options = {}) {
    const { status, search, limit, offset } = options;
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('i.status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(i.name LIKE ? OR i.company LIKE ? OR i.email LIKE ? OR i.phone LIKE ? OR i.message LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    let sql = `
      SELECT i.*, p.name_id as product_name_id, p.slug as product_slug
      FROM inquiries i
      LEFT JOIN products p ON i.product_id = p.id
      ${whereClause}
      ORDER BY i.created_at DESC, i.id DESC
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
    const { status, search } = options;
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(name LIKE ? OR company LIKE ? OR email LIKE ? OR phone LIKE ? OR message LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(`SELECT COUNT(*) as total FROM inquiries ${whereClause}`, params);
    return rows[0]?.total || 0;
  },

  async findById(id) {
    const rows = await query(
      `SELECT i.*, p.name_id as product_name_id, p.slug as product_slug
       FROM inquiries i
       LEFT JOIN products p ON i.product_id = p.id
       WHERE i.id = ? LIMIT 1`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async create(data) {
    const validSources = ['contact_form', 'wa_product'];
    const validStatuses = ['baru', 'dibaca', 'ditindaklanjuti'];
    const validTypes = ['inquiry', 'partnership', 'general'];

    const source = validSources.includes(data.source) ? data.source : 'contact_form';
    const status = validStatuses.includes(data.status) ? data.status : 'baru';
    const type = validTypes.includes(data.type) ? data.type : 'inquiry';

    const sql = `
      INSERT INTO inquiries (type, name, company, email, phone, product_id, quantity, message, source, status, admin_notes, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      type,
      data.name,
      data.company || null,
      data.email,
      data.phone,
      data.product_id || null,
      data.quantity || null,
      data.message || null,
      source,
      status,
      data.admin_notes || null,
      data.ip_address || null
    ];
    const result = await execute(sql, params);
    return result.insertId;
  },

  async updateStatus(id, status, adminNotes = null) {
    let sql = 'UPDATE inquiries SET status = ?';
    const params = [status];

    if (adminNotes !== null && adminNotes !== undefined) {
      sql += ', admin_notes = ?';
      params.push(adminNotes);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    const result = await execute(sql, params);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const result = await execute('DELETE FROM inquiries WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getStats() {
    const rows = await query(
      `SELECT status, COUNT(*) as count
       FROM inquiries
       GROUP BY status`
    );
    const stats = {
      total: 0,
      baru: 0,
      dibaca: 0,
      ditindaklanjuti: 0,
      ditolak: 0
    };
    rows.forEach(r => {
      stats[r.status] = r.count;
      stats.total += r.count;
    });
    return stats;
  }
};

export default inquiryModel;
