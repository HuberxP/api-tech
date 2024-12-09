const pool = require('./conexion');
const cloudinary = require('./cloudinary');
const fs = require('fs');
const { format } = require('date-fns');

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
};

const getImagenes = async (req, res) => {
    try {
        const response = await pool.query('SELECT * FROM imagenes');
        res.status(200).json(response.rows);
    } catch (error) {
        handleError(res, error);
    }
};

const createImagen = async (req, res) => {
    const file = req.file;
    const { destino_id, usuario_id } = req.body;

    if (!file || (!destino_id && !usuario_id)) {
        return res.status(400).json({ error: 'Faltan campos: imagen o id (destino_id/usuario_id)' });
    }

    try {
        // Si hay un usuario_id, primero eliminamos la imagen existente para ese usuario
        if (usuario_id) {
            const existingImageResponse = await pool.query('SELECT * FROM imagenes WHERE usuario_id = $1', [usuario_id]);
            if (existingImageResponse.rows.length > 0) {
                const existingImage = existingImageResponse.rows[0];
                // Eliminar la imagen existente de Cloudinary
                const publicId = existingImage.url.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
                // Eliminar la referencia de la imagen en la base de datos
                await pool.query('DELETE FROM imagenes WHERE id = $1', [existingImage.id]);
            }
        }

        // Subir la nueva imagen a Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'mis_imagenes',
            use_filename: true
        });

        const imageUrl = result.secure_url;
        const fecha_subida = new Date();
        const fecha_formateada = format(fecha_subida, 'yyyy-MM-dd HH:mm:ss');

        let response;
        if (usuario_id) {
            response = await pool.query(
                'INSERT INTO imagenes (url, fecha_subida, usuario_id) VALUES ($1, $2, $3) RETURNING *',
                [imageUrl, fecha_subida, usuario_id]
            );
        } else {
            response = await pool.query(
                'INSERT INTO imagenes (url, fecha_subida, destino_id) VALUES ($1, $2, $3) RETURNING *',
                [imageUrl, fecha_subida, destino_id]
            );
        }

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
            return res.status(404).send('Imagen no encontrada');
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
            return res.status(404).send('Imagen no encontrada');
        }
        res.json(`Imagen ${id} actualizada parcialmente con éxito`);
    } catch (error) {
        handleError(res, error);
    }
};

const getUserImage = async (req, res) => {
    const usuario_id = req.params.usuario_id;

    try {
        const response = await pool.query('SELECT * FROM imagenes WHERE usuario_id = $1', [usuario_id]);
        if (response.rows.length === 0) {
            return res.status(404).send('Imagen no encontrada');
        }
        res.json(response.rows);
    } catch (error) {
        handleError(res, error);
    }
};

const getDestinoImagen = async (req, res) => {
    const destino_id = req.params.destino_id;

    try {
        const response = await pool.query('SELECT * FROM imagenes WHERE destino_id = $1', [destino_id]);
        if (response.rows.length === 0) {
            return res.status(404).send('Imagen no encontrada');
        }
        res.json(response.rows);
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
    getUserImage,
    getDestinoImagen,
    countAllImagenes
};
