// ==UserScript==
// @name         Auto Like / Nope Pro Floating
// @namespace    http://tampermonkey.net/
// @version      1.6
// @match       https://tinder.com/*
// @description  Auto Like con panel flotante, minimizable y contador
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
        return;
    }

    let intervalId = null;
    let ejecutando = false;
    let likes = 0;
    let nopes = 0;
    let contador = 0;

    const panel = document.createElement('div');
    panel.id = 'tm-panel';

    panel.style.position = 'fixed';
    panel.style.bottom = '20px';
    panel.style.right = '20px';
    panel.style.zIndex = '999999';
    panel.style.background = '#222';
    panel.style.color = '#fff';
    panel.style.borderRadius = '10px';
    panel.style.boxShadow = '0 0 10px rgba(0,0,0,.5)';
    panel.style.fontFamily = 'Arial, sans-serif';
    panel.style.minWidth = '240px';
    panel.style.overflow = 'hidden';

    panel.innerHTML = `
        <div id="tm-header"
            style="background:#111;padding:8px 10px;cursor:move;display:flex;justify-content:space-between;align-items:center;">
            <strong style="color:#4CAF50;">Auto Like / Nope</strong>

            <div>
                <button id="tm-minimize"
                    style="background:#444;color:white;border:none;border-radius:4px;padding:2px 7px;cursor:pointer;">
                    –
                </button>
            </div>
        </div>

        <div id="tm-content" style="padding:15px;">
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
        </div>
    `;

    document.body.appendChild(panel);

    const header = document.getElementById('tm-header');
    const content = document.getElementById('tm-content');
    const minimizeBtn = document.getElementById('tm-minimize');
    const btnControl = document.getElementById('tm-start');
    const inputNope = document.getElementById('tm-nope');

    let minimizado = false;

    minimizeBtn.addEventListener('click', () => {
        minimizado = !minimizado;
        content.style.display = minimizado ? 'none' : 'block';
        minimizeBtn.innerText = minimizado ? '+' : '–';
    });

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', function (e) {
        isDragging = true;
        offsetX = e.clientX - panel.getBoundingClientRect().left;
        offsetY = e.clientY - panel.getBoundingClientRect().top;
        panel.style.bottom = 'auto';
        panel.style.right = 'auto';
    });

    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        panel.style.left = `${e.clientX - offsetX}px`;
        panel.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', function () {
        isDragging = false;
    });

    function setStatus(texto, color = '#81C784') {
        const status = document.getElementById('tm-status');
        if (!status) return;
        status.innerText = texto;
        status.style.color = color;
    }

    function actualizarFrecuencia() {
        const porcentaje = parseInt(inputNope.value) || 0;

        if (porcentaje <= 0) {
            document.getElementById('tm-frecuencia').innerText = 'Frecuencia: Sin Nope';
        } else {
            document.getElementById('tm-frecuencia').innerText =
                `Frecuencia: 1 Nope cada ${Math.round(100 / porcentaje)} clics`;
        }
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

        for (const wrapper of wrappers) {
            const button = wrapper.querySelector('button');
            if (!button) continue;

            const html = button.innerHTML;
            const htmlLower = html.toLowerCase();

            if (html.includes('Like') && !html.includes('Super Like')) {
                btnLike = button;
            }

            if (htmlLower.includes('nope')) {
                btnNope = button;
            }
        }

        return { btnLike, btnNope };
    }

    function detener(mensaje = 'Detenido') {
        clearInterval(intervalId);
        intervalId = null;
        ejecutando = false;

        btnControl.innerText = 'Iniciar';
        btnControl.style.background = '#28a745';

        setStatus(mensaje);
    }

    function iniciar() {
        const maxClicks = parseInt(document.getElementById('tm-maxclicks').value);
        const porcentajeNope = parseInt(document.getElementById('tm-nope').value);

        if (!maxClicks || maxClicks <= 0) {
            setStatus('Cantidad inválida', '#ff8080');
            return;
        }

        if (porcentajeNope < 0 || porcentajeNope > 100 || isNaN(porcentajeNope)) {
            setStatus('Porcentaje inválido', '#ff8080');
            return;
        }

        const { btnLike, btnNope } = buscarBotones();

        if (!btnLike || !btnNope) {
            setStatus('Botones no encontrados', '#ff8080');
            return;
        }

        likes = 0;
        nopes = 0;
        contador = 0;

        actualizarContador();

        const frecuenciaNope = porcentajeNope > 0
            ? Math.round(100 / porcentajeNope)
            : 0;

        ejecutando = true;
        btnControl.innerText = 'Detener';
        btnControl.style.background = '#dc3545';

        setStatus(`Ejecutando... ${porcentajeNope}% Nope`);

        intervalId = setInterval(() => {
            if (contador >= maxClicks) {
                detener(`Finalizado | L:${likes} N:${nopes}`);
                return;
            }

            const botones = buscarBotones();

            if (!botones.btnLike || !botones.btnNope) {
                detener('Botones no encontrados');
                setStatus('Botones no encontrados', '#ff8080');
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
            } else {
                botones.btnLike.click();
                likes++;
            }

            actualizarContador();

        }, 2000);
    }

    btnControl.addEventListener('click', () => {
        ejecutando ? detener('Detenido manualmente') : iniciar();
    });

    actualizarFrecuencia();

})();
