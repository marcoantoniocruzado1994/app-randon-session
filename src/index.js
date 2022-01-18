const express = require('express');
const morgan = require('morgan');
const path = require('path');
const axios = require('axios');
const app = express()

//database
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'bpi-rpa-latam.cdw1gc4aj2db.us-east-1.rds.amazonaws.com',
    database: 'dashboard',
    password: 'IT0kYg53L56Mk3HYTZ4m',
    port: 5432
});

// Settings
app.set('port', process.env.PORT || 5000)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))


// Middlewares
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))


// Routes
app.get('/', async (req, res) => {
    
    //consulta a la base de datos con la query que se desea obtener las sesiones totales y distintas del dia 
    let dia = new Date();
    let dia_actual = dia.getDate() - 1;
    let mes_actual = dia.getMonth() + 1;
    let anio_actual = dia.getFullYear();

    if (dia_actual < 10) {
        dia_actual = '0' + dia_actual;
        const data = await pool.query(`select distinct session_id from public.dashboard_bpi where created_at like '${anio_actual}-${mes_actual}-${dia_actual} %'`)
        res.render('./pages/home.ejs', { data: data.rows })
    } else {
        const data = await pool.query(`select distinct session_id from public.dashboard_bpi where created_at like '${anio_actual}-${mes_actual}-${dia_actual} %'`)
        res.render('./pages/home.ejs', { data: data.rows })
    }


})


app.post('/seleccionar', async (req, res) => {
    //fecha del dia anterior ya que la data es con un dias de atras
    let  dia = new Date();
    let  dia_actual = dia.getDate() - 1;
    let  mes_actual = dia.getMonth() + 1;
    let  anio_actual = dia.getFullYear();

    let  data = await pool.query(`select distinct session_id from public.dashboard_bpi where created_at like '2021-12-26 %'`)
    //logica para la generacion de las 8 sessiones
    let ochoRandom = [];
    let posicionesElegibles = [];
    let posiciones = data.rows.length;
    posicionesElegibles.length = posiciones;
    posicionesElegibles.fill(true);
    let i, j, r, c;
    let contadorElegidas = 0;
    for (i = 0; i < 8; i++) {
        r = Math.floor(Math.random() * (posiciones - contadorElegidas)) + 1;
        c = 0;
        j = 0;
        do if (posicionesElegibles[j++]) c++; while (c < r);
        j--;
        ochoRandom.push(data.rows[j]);
        posicionesElegibles[j] = false;
        contadorElegidas++;}
    //envio de correo una vez generada las 8 session_id
     axios.post('https://mthhurndg7.execute-api.us-east-1.amazonaws.com/bpi/sendemail', {
        to: "m.cruzado@rpalatam.com.pe", //correo de lucia creeria que se deberia enviar 
        text: "Sesiones de prueba  2021-12-26 " + "<br> " + ochoRandom[0].session_id + "  <br> " + ochoRandom[1].session_id + " <br>  " + ochoRandom[2].session_id + " <br>  " + ochoRandom[3].session_id + " <br>  " + ochoRandom[4].session_id + " <br>  " + ochoRandom[5].session_id + " <br>  " + ochoRandom[6].session_id + " <br>  " + ochoRandom[7].session_id,
        subject: "Sessiones a revisión",
        html: true
    })
        .then(function (response) {
            console.log(response.data);
        })
        .catch(function (error) {
            console.log(error);
        });

    //renderizacion de la pagina de seleccionar
    res.render('./pages/escogidas.ejs', { elegidos: ochoRandom })
})

// Static files
app.use(express.static(path.join(__dirname, 'public')))

// init server
app.listen(app.get('port'))
console.log('listening on port 5000');