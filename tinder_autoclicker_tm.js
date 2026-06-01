// ==UserScript==
// @name         Auto Like / Nope Pro Debug
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Auto Like con porcentaje configurable, contador, estado y sitio permitido
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const SITIOS_PERMITIDOS = [
        'tinder.com',
        'www.tinder.com'
    ];

    if (!SITIOS_PERMITIDOS.some(site => window.location.hostname.includes(site))) {
        console.log('[AutoLikeNope] Sitio no permitido:', window.location.hostname);
        return;
    }

    console.log('[AutoLikeNope] Script cargado en:', window.location.hostname);

    let intervalId = null;
    let ejecutando = false;

    let likes = 0;
    let nopes = 0;
    let contador = 0;

    const panel = document.createElement('div');

    panel.style.position = 'fixed';
    panel.style.bottom = '20px';
    panel.style.right = '20px';
    panel.style.zIndex = '999999';
    panel.style.background = '#222';
    panel.style.color = '#fff';
    panel.style.padding = '15px';
    panel.style.borderRadius = '10px';
    panel.style.boxShadow = '0 0 10px rgba(0,0,0,.5)';
    panel.style.fontFamily = 'Arial, sans-serif';
    panel.style.minWidth = '230px';

    panel.innerHTML = `
        <div style="font-size:16px;font-weight:bold;margin-bottom:12px;text-align:center;color:#4CAF50;">
            Auto Like / Nope
        </div>

        <div style="margin-bottom:10px;">
            <label style="display:block;margin-bottom:4px;font-weight:bold;">
                Cantidad de clics
            </label>
            <input id="tm-maxclicks" type="number" value="50" min="1" placeholder="Ej: 100"
                style="width:130px;padding:6px;border:1px solid #666;border-radius:4px;background:#fff;color:#000;font-size:14px;">
        </div>

        <div style="margin-bottom:10px;">
            <label style="display:block;margin-bottom:4px;font-weight:bold;">
                Porcentaje Nope (%)
            </label>
            <input id="tm-nope" type="number" value="25" min="0" max="100" placeholder="Ej: 25"
                style="width:130px;padding:6px;border:1px solid #666;border-radius:4px;background:#fff;color:#000;font-size:14px;">
        </div>

        <div id="tm-frecuencia" style="margin-bottom:12px;font-size:13px;color:#FFD54F;">
            Frecuencia: 1 Nope cada 4 clics
        </div>

        <div id="tm-status"
            style="margin-bottom:12px;padding:8px;background:#2b2b2b;border-radius:5px;font-size:12px;color:#81C784;min-height:18px;">
            Esperando...
        </div>

        <div style="margin-bottom:12px;padding:8px;background:#333;border-radius:5px;font-size:13px;">
            <strong>Progreso</strong><br>
            Total: <span id="tm-total">0</span><br>
            Likes: <span id="tm-likes">0</span><br>
            Nope: <span id="tm-nopes">0</span>
        </div>

        <button id="tm-start"
            style="width:100%;padding:10px;background:#28a745;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold;">
            Iniciar
        </button>
    `;

    document.body.appendChild(panel);

    const btnControl = document.getElementById('tm-start');
    const inputNope = document.getElementById('tm-nope');

    function setStatus(texto, color = '#81C784') {
        const status = document.getElementById('tm-status');
        if (!status) return;

        status.innerText = texto;
        status.style.color = color;
    }

    function actualizarFrecuencia() {
        const porcentaje = parseInt(inputNope.value) || 0;

        let texto = '';

        if (porcentaje <= 0) {
            texto = 'Frecuencia: Sin Nope';
        } else {
            texto = `Frecuencia: 1 Nope cada ${Math.round(100 / porcentaje)} clics`;
        }

        document.getElementById('tm-frecuencia').innerText = texto;
    }

    inputNope.addEventListener('input', actualizarFrecuencia);

    function actualizarContador() {
        document.getElementById('tm-total').innerText = contador;
        document.getElementById('tm-likes').innerText = likes;
        document.getElementById('tm-nopes').innerText = nopes;
    }

    function buscarBotones() {
        const wrappers = document.querySelectorAll('.gamepad-button-wrapper');

        let btnLike = null;
        let btnNope = null;

        console.log('[AutoLikeNope] Wrappers encontrados:', wrappers.length);

        for (const wrapper of wrappers) {
            const button = wrapper.querySelector('button');

            if (!button) continue;

            const html = button.innerHTML;
            const htmlLower = html.toLowerCase();

            if (
                html.includes('Like') &&
                !html.includes('Super Like')
            ) {
                btnLike = button;
                console.log('[AutoLikeNope] Botón Like encontrado');
            }

            if (htmlLower.includes('nope')) {
                btnNope = button;
                console.log('[AutoLikeNope] Botón Nope encontrado');
            }
        }

        return {
            btnLike,
            btnNope
        };
    }

    function detener(mensaje = 'Detenido') {
        clearInterval(intervalId);

        intervalId = null;
        ejecutando = false;

        btnControl.innerText = 'Iniciar';
        btnControl.style.background = '#28a745';

        setStatus(mensaje);
        console.log('[AutoLikeNope]', mensaje);
    }

    function iniciar() {
        const maxClicks = parseInt(document.getElementById('tm-maxclicks').value);
        const porcentajeNope = parseInt(document.getElementById('tm-nope').value);

        console.log('[AutoLikeNope] Intentando iniciar');
        console.log('[AutoLikeNope] maxClicks:', maxClicks);
        console.log('[AutoLikeNope] porcentajeNope:', porcentajeNope);

        if (!maxClicks || maxClicks <= 0) {
            setStatus('Cantidad de clics inválida', '#ff8080');
            console.warn('[AutoLikeNope] Cantidad de clics inválida');
            return;
        }

        if (
            porcentajeNope < 0 ||
            porcentajeNope > 100 ||
            isNaN(porcentajeNope)
        ) {
            setStatus('Porcentaje Nope inválido', '#ff8080');
            console.warn('[AutoLikeNope] Porcentaje Nope inválido');
            return;
        }

        const { btnLike, btnNope } = buscarBotones();

        if (!btnLike || !btnNope) {
            setStatus('No se encontraron botones', '#ff8080');
            console.warn('[AutoLikeNope] No se encontraron botones');
            console.log('[AutoLikeNope] btnLike:', btnLike);
            console.log('[AutoLikeNope] btnNope:', btnNope);
            return;
        }

        likes = 0;
        nopes = 0;
        contador = 0;

        actualizarContador();

        let frecuenciaNope = 0;

        if (porcentajeNope > 0) {
            frecuenciaNope = Math.round(100 / porcentajeNope);
        }

        ejecutando = true;

        btnControl.innerText = 'Detener';
        btnControl.style.background = '#dc3545';

        setStatus(`Ejecutando... ${porcentajeNope}% Nope`);

        console.log(
            `[AutoLikeNope] Iniciado | Clicks=${maxClicks} | Nope=${porcentajeNope}% | Frecuencia=${frecuenciaNope}`
        );

        intervalId = setInterval(() => {
            if (contador >= maxClicks) {
                detener(`Finalizado | L:${likes} N:${nopes}`);
                return;
            }

            const botones = buscarBotones();

            if (!botones.btnLike || !botones.btnNope) {
                detener('Botones no encontrados');
                setStatus('Botones no encontrados', '#ff8080');
                console.warn('[AutoLikeNope] Botones desaparecieron durante la ejecución');
                return;
            }

            contador++;

            if (
                porcentajeNope > 0 &&
                frecuenciaNope > 0 &&
                contador % frecuenciaNope === 0
            ) {
                botones.btnNope.click();
                nopes++;
                console.log(`[AutoLikeNope] [${contador}/${maxClicks}] NOPE`);
            } else {
                botones.btnLike.click();
                likes++;
                console.log(`[AutoLikeNope] [${contador}/${maxClicks}] LIKE`);
            }

            actualizarContador();

        }, 2000);
    }

    btnControl.addEventListener('click', () => {
        if (ejecutando) {
            detener('Detenido manualmente');
        } else {
            iniciar();
        }
    });

    actualizarFrecuencia();

})();
