const pool = require('./conexion');


const handleError = (res, error) => {
    console.error("Error en la consulta SQL:", error);
    res.status(500).json({ error: 'Error en la consulta SQL' });
};




const countAllImagenes = async (req, res) => {
    try {
        const response = await pool.query('SELECT COUNT(*) FROM imagenes');
        const count = parseInt(response.rows[0].count, 10);
        res.status(200).json({ count });
    } catch (error) {
        handleError(res, error);
    }
}




const getImagenes = async (req, res) => {
    try {
        const response = await pool.query('SELECT * FROM imagenes');
        res.status(200).json(response.rows);
    } catch (error) {
        handleError(res, error);
    }
};

const createImagen = async (req, res) => {
    const {url, fecha_subida, destino_id} = req.body;
    if (!url || !destino_id) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    try {
        const response = await pool.query(
            'INSERT INTO imagenes (url, destino_id) VALUES ($1, $2)',
            [url, destino_id]
        );
        res.json({
            message: 'Conjunto creado con éxito',
            body: {
                user: { url, destino_id, fecha_subida }
            }
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getImagenId = async (req, res) => {
    const id = req.params.id;
    try {
        const response = await pool.query('SELECT * FROM imagenes WHERE id = $1', [id]);
        if (response.rows.length === 0) {
            return res.status(404).send('Imagen no encontrado');
        }
        res.json(response.rows);
    } catch (error) {
        handleError(res, error);
    }
};


const deleteImagen = async (req, res) => {
    const id = req.params.id;
    try {
        const response = await pool.query('DELETE FROM imagenes WHERE id = $1', [id]);
        if (response.rowCount === 0) {
            return res.status(404).send('Imagen no encontrada');
        }
        res.json(`Imagen ${id} eliminada con éxito`);
    } catch (error) {
        handleError(res, error);
    }
};

const patchImagen = async (req, res) => {
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

    const query = `UPDATE imagenes SET ${fields.join(', ')} WHERE id = $${idx}`;
    values.push(id);

    try {
        const response = await pool.query(query, values);
        if (response.rowCount === 0) {
            return res.status(404).send('Imagenes no encontradas');
        }
        res.json(`Imagen ${id} actualizada parcialmente con éxito`);
    } catch (error) {
        handleError(res, error);
    }

};





module.exports = {
    getImagenes,
    createImagen,
    getImagenId,
    deleteImagen,
    patchImagen, 
    countAllImagenes
   
};
