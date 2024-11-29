const pool = require('./conexion');


const handleError = (res, error) => {
    console.error("Error en la consulta SQL:", error);
    res.status(500).json({ error: 'Error en la consulta SQL' });
};






const getRol = async (req, res) => {
    try {
        const response = await pool.query('SELECT * FROM roles');
        res.status(200).json(response.rows);
    } catch (error) {
        handleError(res, error);
    }
};

const createRol = async (req, res) => {
    const { tipo_administracion, descripcion } = req.body;
    if (!tipo_administracion || !descripcion) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    try {
        const response = await pool.query(
            'INSERT INTO roles (tipo_administracion, descripcion) VALUES ($1, $2)',
            [tipo_administracion, descripcion]
        );
        res.json({
            message: 'Rol creado con éxito',
            body: {
                user: { tipo_administracion, descripcion }
            }
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getRolbyID = async (req, res) => {
    const id = req.params.id;
    try {
        const response = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
        if (response.rows.length === 0) {
            return res.status(404).send('rol no encontrado');
        }
        res.json(response.rows);
    } catch (error) {
        handleError(res, error);
    }
};


const deleteRol = async (req, res) => {
    const id = req.params.id;
    try {
        const response = await pool.query('DELETE FROM roles WHERE id = $1', [id]);
        if (response.rowCount === 0) {
            return res.status(404).send('Rol no encontrado');
        }
        res.json(`Rol ${id} eliminada con éxito`);
    } catch (error) {
        handleError(res, error);
    }
};

const patchRol = async (req, res) => {
    const id = req.params.id;
    const updates = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
    }

    const query = `UPDATE roles SET ${fields.join(', ')} WHERE id = $${idx}`;
    values.push(id);

    try {
        const response = await pool.query(query, values);
        if (response.rowCount === 0) {
            return res.status(404).send('rol no encontrado');
        }
        res.json(`Rol ${id} actualizado parcialmente con éxito`);
    } catch (error) {
        handleError(res, error);
    }

};





module.exports = {
    getRol,
    createRol,
    getRolbyID,
    deleteRol,
    patchRol,
   

};
