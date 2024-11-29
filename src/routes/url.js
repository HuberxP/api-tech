const { Router } = require('express');
const router = Router();

const { 
    getUsers, 
    createUser, 
    getUserbyId, 
    deleteUser, 
    updateUser, 
    patchUser, 
    optionsHandler, 
    loginUser,
    countAllUsers 
} = require('../controllers/controllerUser');



const { 
    getDestinos,
    createDestinos,
    getDestinobyId,
    deleteDestino,
    patchDestino,
    countAllDestinos
} = require('../controllers/controllerDestinos');

const { 
    getImagenes,
    createImagen,
    getImagenId,
    deleteImagen,
    patchImagen,
    countAllImagenes } =
require('../controllers/controllerImagenes');

const {
    getRol,
    createRol,
    getRolbyID,
    deleteRol,
    patchRol,
} = require('../controllers/controllerRol')

// Rutas para usuarios
router.get('/usuario', getUsers);
router.get('/usuario/:id', getUserbyId);
router.post('/usuario/registro', createUser); 
router.post('/usuario/login', loginUser); 
router.delete('/usuario/:id', deleteUser);
router.put('/usuario/:id', updateUser);
router.patch('/usuario/:id', patchUser);
router.options('/usuario', optionsHandler);
router.get('/usuario/count', countAllUsers); 

// Rutas para imagenes
router.get('/imagenes', getImagenes);
router.post('/imagenes', createImagen);
router.get('/imagenes/:id', getImagenId);
router.delete('/imagenes/:id', deleteImagen);
router.patch('/imagenes/:id', patchImagen);
router.options('/imagenes', optionsHandler);
router.get('/imagenes/count', countAllImagenes);


// Rutas para destino
router.get('/destino', getDestinos);
router.post('/destino', createDestinos);
router.get('/destino/:id', getDestinobyId);
router.delete('/destino/:id', deleteDestino);
router.patch('/destino/:id', patchDestino);
router.options('/destino', optionsHandler);
router.get('/destino/count', countAllDestinos);

// Rutas para roles
router.get('/rol', getRol);
router.post('/rol', createRol);
router.get('/rol/:id', getRolbyID);
router.delete('/rol/:id', deleteRol);
router.patch('/rol/:id', patchRol);
router.options('/rol', optionsHandler);



module.exports = router;
