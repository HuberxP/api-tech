const pool = require('./conexion');


const handleError = (res, error) => {
    console.error('Error ejecutando la consulta', error.stack);
    res.status(500).send('Error conectando a la base de datos');
};



// Función para contar todos los destinos


const countAllDestinos = async (req, res) => {
    try {
        const response = await pool.query('SELECT COUNT(*) FROM destinos');
        const count = parseInt(response.rows[0].count, 10);
        res.status(200).json({ count });
    } catch (error) {
        handleError(res, error);
    }
};





const getDestinos = async (req, res) => {
    try {
        const response = await pool.query('SELECT * FROM destinos');
        res.status(200).json(response.rows);
    } catch (error) {
        handleError(res, error);
    }
};

const createDestinos = async (req, res) => {
    const { nombre_d, ubicacion, descripcion } = req.body;
    if (!nombre_d || !ubicacion || !descripcion) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    try {
        const response = await pool.query(
            'INSERT INTO destinos (nombre_d, ubicacion, descripcion) VALUES ($1, $2, $3)',
            [nombre_d, ubicacion, descripcion]
        );
        res.json({
            message: 'Destino creado con éxito',
            body: {
                user: { nombre_d, ubicacion, descripcion }
            }
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getDestinobyId = async (req, res) => {
    const id = req.params.id;
    try {
        const response = await pool.query('SELECT * FROM destinos WHERE id = $1', [id]);
        if (response.rows.length === 0) {
            return res.status(404).send('Destino no encontrado');
        }
        res.json(response.rows);
    } catch (error) {
        handleError(res, error);
    }
};



const deleteDestino = async (req, res) => {
    const id = req.params.id;
    try {
        const response = await pool.query('DELETE FROM destinos WHERE id = $1', [id]);
        if (response.rowCount === 0) {
            return res.status(404).send('Producto no encontrado');
        }
        res.json(`Destino ${id} eliminado con éxito`);
    } catch (error) {
        handleError(res, error);
    }
};

const patchDestino = async (req, res) => {
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

    const query = `UPDATE destinos SET ${fields.join(', ')} WHERE id = $${idx}`;
    values.push(id);

    try {
        const response = await pool.query(query, values);
        if (response.rowCount === 0) {
            return res.status(404).send('Destino no encontrado');
        }
        res.json(`Destino ${id} actualizado parcialmente con éxito`);
    } catch (error) {
        handleError(res, error);
    }

};





module.exports = {
    getDestinos,
    createDestinos,
    getDestinobyId,
    deleteDestino,
    patchDestino,
    countAllDestinos

};
