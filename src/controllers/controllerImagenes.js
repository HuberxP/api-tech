const pool = require('./conexion');
const cloudinary = require('./cloudinary');
const fs = require('fs'); // Para borrar el archivo temporal tras subirlo a Cloudinary


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
    // `req.file` es el archivo subido por multer
    const file = req.file;
    const { destino_id } = req.body; // supondremos que el destino se manda en el body

    if (!file || !destino_id) {
        return res.status(400).json({ error: 'Faltan campos: imagen o destino_id' });
    }

    try {
        // Subir la imagen a Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'mis_imagenes', // Opcional: carpeta para organizar en Cloudinary
            use_filename: true
        });

        const imageUrl = result.secure_url;

        // Guardar URL en la base de datos
        const response = await pool.query(
            'INSERT INTO imagenes (url, destino_id) VALUES ($1, $2) RETURNING *',
            [imageUrl, destino_id]
        );

        // Borrar el archivo temporal de la carpeta uploads
        fs.unlinkSync(file.path);

        res.json({
            message: 'Imagen subida y guardada con éxito',
            data: response.rows[0]
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
